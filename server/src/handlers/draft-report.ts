// API: POST /reports/{id}/draft. Figures are computed in SQL; Bedrock only writes prose around fact placeholders.
// Any digit sequence the model writes outside a placeholder causes the draft to be rejected.
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { audit, pool } from '../lib/db.js';
import { callForJson, MODEL_ID, ModelRefusal } from '../lib/bedrock.js';
import { DRAFT_SYSTEM, DRAFT_TOOL } from '../lib/prompts.js';

interface Draft { sections: { heading: string; paragraphs: string[] }[] }

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const reportId = event.pathParameters?.id;
  const sub = event.requestContext.authorizer.jwt.claims.sub as string;
  const { rows: [user] } = await pool.query('SELECT id, org_id, role FROM users WHERE cognito_sub = $1', [sub]);
  const { rows: [rep] } = await pool.query(
    `SELECT r.*, g.org_id, g.award_amount, g.code FROM reports r JOIN grants g ON g.id = r.grant_id
     JOIN grant_users gu ON gu.grant_id = g.id AND gu.user_id = $2 WHERE r.id = $1`, [reportId, user?.id]);
  if (!user || !rep) return { statusCode: 404, body: 'Not found' };
  if (!['program', 'finance'].includes(user.role)) return { statusCode: 403, body: 'Not permitted' };
  if (!['not_started', 'draft'].includes(rep.status)) return { statusCode: 409, body: 'Report is past drafting' };

  const facts = await buildFacts(rep);
  let draft: Draft;
  try {
    draft = await callForJson<Draft>({ system: DRAFT_SYSTEM, user: `<facts>\n${JSON.stringify(facts)}\n</facts>\nWrite the ${rep.title}.`, tool: DRAFT_TOOL });
  } catch (e) {
    if (e instanceof ModelRefusal) return { statusCode: 422, body: 'Draft could not be generated; prepare manually.' };
    throw e;
  }
  const knownIds = new Set(Object.keys(facts.values).concat(facts.sources));
  const problems = validateDraft(draft, knownIds);
  if (problems.length) {
    await audit(rep.org_id, 'Rejected model draft', 'report', rep.id, { problems }, { system: `bedrock:${MODEL_ID}` });
    return { statusCode: 422, body: JSON.stringify({ error: 'Draft failed grounding checks', problems }) };
  }

  await pool.query("UPDATE reports SET status = 'draft', draft = $2, facts_snapshot = $3 WHERE id = $1", [rep.id, JSON.stringify(draft), JSON.stringify(facts)]);
  await audit(rep.org_id, 'Generated report draft', 'report', rep.id, { gaps: facts.gaps.length }, { user: user.id, system: `bedrock:${MODEL_ID}` });
  return { statusCode: 200, body: JSON.stringify({ draft, facts }) };
}

/** Strip placeholders and citations, then refuse any remaining digits (numbers must come from facts). */
export function validateDraft(d: Draft, known: Set<string>) {
  const problems: string[] = [];
  for (const s of d.sections) for (const p of s.paragraphs) {
    for (const [, id] of p.matchAll(/\{\{fact:([^}]+)\}\}|\[\[src:([^\]]+)\]\]/g)) if (id && !known.has(id)) problems.push(`Unknown reference ${id}`);
    const bare = p.replace(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]|§\s?\d+(\.\d+)*(\([a-z]\))?/g, '');
    if (/\d/.test(bare)) problems.push(`Ungrounded number in: "${p.slice(0, 80)}…"`);
  }
  return problems;
}

async function buildFacts(rep: { id: string; grant_id: string; period_start: string; period_end: string; award_amount: string }) {
  const values: Record<string, string> = {};
  const sources: string[] = [];
  const { rows: lines } = await pool.query(
    `SELECT bl.id, bl.category, bl.approved_amount,
            coalesce(sum(t.amount) FILTER (WHERE t.txn_date BETWEEN $2 AND $3), 0) AS period,
            coalesce(sum(t.amount) FILTER (WHERE t.txn_date <= $3), 0) AS cumulative,
            array_remove(array_agg(t.id) FILTER (WHERE t.txn_date BETWEEN $2 AND $3), NULL) AS txn_ids
     FROM budget_lines bl LEFT JOIN transactions t ON t.budget_line_id = bl.id
     WHERE bl.grant_id = $1 GROUP BY bl.id`, [rep.grant_id, rep.period_start, rep.period_end]);
  for (const l of lines) {
    values[`line:${l.id}:period`] = l.period;
    values[`line:${l.id}:cumulative`] = l.cumulative;
    values[`line:${l.id}:approved`] = l.approved_amount;
    sources.push(...l.txn_ids);
  }
  const { rows: unsupported } = await pool.query(
    `SELECT t.id, t.amount FROM transactions t WHERE t.grant_id = $1 AND t.txn_date BETWEEN $2 AND $3
     AND NOT EXISTS (SELECT 1 FROM transaction_documents td WHERE td.transaction_id = t.id AND td.role = 'support')`, [rep.grant_id, rep.period_start, rep.period_end]);
  const { rows: outcomes } = await pool.query(
    `SELECT o.id, o.metric, o.label, o.value, o.target, array_remove(array_agg(od.document_id), NULL) AS docs
     FROM outcome_entries o LEFT JOIN outcome_documents od ON od.outcome_entry_id = o.id WHERE o.grant_id = $1 GROUP BY o.id`, [rep.grant_id]);
  for (const o of outcomes) { values[`outcome:${o.id}`] = o.value; sources.push(o.id, ...o.docs); }
  const { rows: milestones } = await pool.query('SELECT id, title, due_date, status FROM milestones WHERE grant_id = $1', [rep.grant_id]);
  const { rows: notes } = await pool.query(
    'SELECT ve.budget_line_id, ve.note FROM variance_explanations ve JOIN budget_lines bl ON bl.id = ve.budget_line_id WHERE bl.grant_id = $1 AND ve.period_end = $2', [rep.grant_id, rep.period_end]);
  const { rows: missingMetrics } = await pool.query(
    `SELECT r.id, r.title FROM requirements r WHERE r.grant_id = $1 AND r.review = 'accepted' AND r.requires_metric IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM outcome_entries o WHERE o.grant_id = r.grant_id AND o.metric ILIKE '%' || r.requires_metric || '%')`, [rep.grant_id]);
  sources.push(...milestones.map((m) => m.id), ...unsupported.map((u) => u.id), ...missingMetrics.map((r) => r.id));
  return {
    values, sources,
    lines: lines.map((l) => ({ id: l.id, category: l.category, explanation: notes.find((n) => n.budget_line_id === l.id)?.note ?? null })),
    unsupported: unsupported.map((u) => u.id),
    outcomes: outcomes.map((o) => ({ id: o.id, metric: o.metric, label: o.label, verified: o.docs.length > 0, evidence: o.docs })),
    milestones,
    gaps: missingMetrics.map((r) => ({ requirement: r.id, missing: r.title })),
  };
}
