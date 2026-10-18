// S3 ObjectCreated (prefix org/*/grant/*/agreement/) → Textract text detection → clause segmentation → Bedrock extraction.
// Key layout: org/<orgId>/grant/<grantId>/agreement/<documentId>.pdf  (documents row is created when the upload URL is issued)
import type { S3Event } from 'aws-lambda';
import { GetDocumentTextDetectionCommand, StartDocumentTextDetectionCommand, TextractClient, type Block } from '@aws-sdk/client-textract';
import { audit, pool } from '../lib/db.js';
import { callForJson, MODEL_ID, ModelRefusal } from '../lib/bedrock.js';
import { EXTRACTION_SYSTEM, EXTRACTION_TOOL } from '../lib/prompts.js';

const textract = new TextractClient({});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Extracted { requirements: { type: string; title: string; detail: string; clause_ref: string; due_date: string | null; requires_metric: string | null; confidence: number }[] }

export async function handler(event: S3Event) {
  for (const rec of event.Records) {
    const bucket = rec.s3.bucket.name;
    const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, ' '));
    const m = key.match(/^org\/([^/]+)\/grant\/([^/]+)\/agreement\/([^/.]+)\./);
    if (!m) continue;
    const [, orgId, grantId, documentId] = m;

    const lines = await detectLines(bucket, key);
    const clauses = segmentClauses(lines);
    if (!clauses.length) {
      await pool.query("UPDATE documents SET extraction_status = 'unsupported' WHERE id = $1", [documentId]);
      continue;
    }
    const clauseIds = new Map<string, string>();
    for (const c of clauses) {
      const { rows } = await pool.query('INSERT INTO document_clauses (document_id, ref, page, heading, body) VALUES ($1,$2,$3,$4,$5) RETURNING id', [documentId, c.ref, c.page, c.heading, c.body]);
      clauseIds.set(c.ref, rows[0].id);
    }

    let out: Extracted;
    try {
      out = await callForJson<Extracted>({
        system: EXTRACTION_SYSTEM,
        user: `<agreement>\n${clauses.map((c) => `[${c.ref} | p.${c.page}] ${c.heading ?? ''} ${c.body}`).join('\n')}\n</agreement>`,
        tool: EXTRACTION_TOOL,
      });
    } catch (e) {
      await pool.query("UPDATE documents SET extraction_status = 'failed' WHERE id = $1", [documentId]);
      await audit(orgId, 'Requirement extraction failed', 'document', documentId, { reason: e instanceof ModelRefusal ? 'refusal' : String(e) }, { system: `bedrock:${MODEL_ID}` });
      continue;
    }

    // Keep only requirements whose citation resolves to a real clause; everything enters as pending review.
    let kept = 0;
    for (const r of out.requirements) {
      const clauseId = clauseIds.get(r.clause_ref) ?? [...clauseIds].find(([ref]) => r.clause_ref.startsWith(ref))?.[1];
      if (!clauseId) continue;
      await pool.query(
        `INSERT INTO requirements (grant_id, clause_id, type, title, detail, due_date, requires_metric, model_confidence, model_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [grantId, clauseId, r.type, r.title, r.detail, r.due_date, r.requires_metric, Math.max(0, Math.min(1, r.confidence)), MODEL_ID],
      );
      kept++;
    }
    await pool.query("UPDATE documents SET extraction_status = 'complete' WHERE id = $1", [documentId]);
    await audit(orgId, 'Extracted requirements', 'document', documentId, { proposed: out.requirements.length, kept, dropped_uncited: out.requirements.length - kept }, { system: `bedrock:${MODEL_ID}` });
  }
}

async function detectLines(bucket: string, key: string) {
  const { JobId } = await textract.send(new StartDocumentTextDetectionCommand({ DocumentLocation: { S3Object: { Bucket: bucket, Name: key } } }));
  const blocks: Block[] = [];
  let next: string | undefined;
  for (let i = 0; i < 120; i++) {
    const res = await textract.send(new GetDocumentTextDetectionCommand({ JobId, NextToken: next }));
    if (res.JobStatus === 'IN_PROGRESS') { await sleep(2000); continue; }
    if (res.JobStatus !== 'SUCCEEDED' && res.JobStatus !== 'PARTIAL_SUCCESS') throw new Error(`Textract ${res.JobStatus}`);
    blocks.push(...(res.Blocks ?? []));
    next = res.NextToken;
    if (!next) break;
  }
  return blocks.filter((b) => b.BlockType === 'LINE').map((b) => ({ text: b.Text ?? '', page: b.Page ?? 1 }));
}

/** Split lines into clauses at numbered headings such as "6.3 Budget variance" or "§6.3". */
export function segmentClauses(lines: { text: string; page: number }[]) {
  const out: { ref: string; page: number; heading: string | null; body: string }[] = [];
  for (const l of lines) {
    const h = l.text.match(/^§?\s*(\d+(?:\.\d+)*)\.?\s+(.{0,80})$/);
    if (h) out.push({ ref: `§${h[1]}`, page: l.page, heading: h[2] || null, body: '' });
    else if (out.length) out[out.length - 1].body += (out[out.length - 1].body ? ' ' : '') + l.text;
  }
  return out.filter((c) => c.body.length > 0);
}
