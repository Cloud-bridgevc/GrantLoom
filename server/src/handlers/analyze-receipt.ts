// S3 ObjectCreated (prefix org/*/grant/*/evidence/) → Textract AnalyzeExpense for receipts/invoices.
// Extracted totals are compared with the linked ledger entry; they never overwrite it.
import type { S3Event } from 'aws-lambda';
import { AnalyzeExpenseCommand, TextractClient } from '@aws-sdk/client-textract';
import { audit, pool } from '../lib/db.js';

const textract = new TextractClient({});
const SUPPORTED = /\.(pdf|png|jpe?g|tiff?)$/i;

export async function handler(event: S3Event) {
  for (const rec of event.Records) {
    const bucket = rec.s3.bucket.name;
    const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, ' '));
    const m = key.match(/^org\/([^/]+)\/grant\/[^/]+\/evidence\/([^/.]+)\./);
    if (!m) continue;
    const [, orgId, documentId] = m;
    const { rows: [doc] } = await pool.query('SELECT kind FROM documents WHERE id = $1', [documentId]);
    if (!doc || !['receipt', 'invoice'].includes(doc.kind) || !SUPPORTED.test(key)) {
      await pool.query("UPDATE documents SET extraction_status = 'unsupported' WHERE id = $1", [documentId]);
      continue;
    }

    const res = await textract.send(new AnalyzeExpenseCommand({ Document: { S3Object: { Bucket: bucket, Name: key } } }));
    const exp = res.ExpenseDocuments?.[0];
    const field = (type: string) => exp?.SummaryFields?.find((f) => f.Type?.Text === type)?.ValueDetection?.Text;
    const money = (s?: string) => (s ? Number(s.replace(/[^0-9.\-]/g, '')) : undefined);
    const extracted = {
      vendor: field('VENDOR_NAME'),
      date: field('INVOICE_RECEIPT_DATE'),
      total: money(field('TOTAL')),
      lineItems: exp?.LineItemGroups?.flatMap((g) => g.LineItems ?? []).map((li) => ({
        desc: li.LineItemExpenseFields?.find((f) => f.Type?.Text === 'ITEM')?.ValueDetection?.Text ?? '',
        amount: money(li.LineItemExpenseFields?.find((f) => f.Type?.Text === 'PRICE')?.ValueDetection?.Text),
      })) ?? [],
    };
    await pool.query("UPDATE documents SET extraction_status = 'complete', extracted = $2 WHERE id = $1", [documentId, JSON.stringify(extracted)]);
    await audit(orgId, 'Analyzed receipt', 'document', documentId, { total: extracted.total, vendor: extracted.vendor }, { system: 'textract:AnalyzeExpense' });
  }
}
