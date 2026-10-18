import { useState } from 'react';
import { Modal, PageHead } from '../../components/ui';
import type { Evidence, EvidenceKind } from '../../data/types';
import { fmtDate, usd } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';

export function EvidencePage() {
  const { db, user } = useStore();
  const { scope } = useScope();
  const [kind, setKind] = useState('All');
  const [open, setOpen] = useState(false);
  const items = db.evidence.filter((e) => (scope === 'all' || e.grantId === scope) && (kind === 'All' || e.kind === kind));
  const kinds = ['All', ...new Set(db.evidence.map((e) => e.kind))];
  const usedBy = (id: string) => [
    ...db.transactions.filter((t) => t.evidenceIds.includes(id) || t.quoteIds?.includes(id)).map((t) => t.id),
    ...db.milestones.filter((m) => m.evidenceIds.includes(id)).map((m) => m.id),
  ];

  return (
    <>
      <PageHead title="Receipt & evidence library" sub="Documents stored in Amazon S3 (encrypted, versioned). Supported formats are read with Amazon Textract; extracted fields are checked against the ledger."
        actions={user.role !== 'viewer' && <button className="btn btn-primary" onClick={() => setOpen(true)}>⬆ Upload evidence</button>} />
      <div className="row" style={{ marginBottom: 14 }}>
        {kinds.map((k) => <button key={k} className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setKind(k)}>{k}</button>)}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Document</th><th>Type</th><th>Uploaded</th><th>Extraction</th><th>Extracted fields</th><th>Linked to</th></tr></thead>
          <tbody>
            {items.map((e) => {
              const links = usedBy(e.id);
              const mismatch = /differs/i.test(e.extracted?.note ?? '');
              return (
                <tr key={e.id}>
                  <td className="mono">{e.id}</td>
                  <td><span className="mono" style={{ wordBreak: 'break-all' }}>{e.filename}</span><div className="small muted">{db.grants.find((g) => g.id === e.grantId)!.code}</div></td>
                  <td>{e.kind}</td>
                  <td className="small">{fmtDate(e.uploaded)}<div className="muted">{e.uploadedBy}</div></td>
                  <td><span className={`badge ${e.extraction === 'Textract' ? 'navy' : ''}`}>{e.extraction}</span></td>
                  <td className="small">
                    {e.extracted?.vendor && <div>{e.extracted.vendor}</div>}
                    {e.extracted?.total !== undefined && <div>Total {usd(e.extracted.total)}</div>}
                    {e.extracted?.lineItems?.map((li) => <div key={li.desc} className="muted">· {li.desc} {usd(li.amount)}</div>)}
                    {e.extracted?.note && <div className={mismatch || /unsigned/.test(e.extracted.note) ? 'unverified' : 'muted'}>{e.extracted.note}</div>}
                  </td>
                  <td>{links.length ? links.map((l) => <span key={l} className="cite">{l}</span>) : <span className="badge warn">Unlinked</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && <UploadModal onClose={() => setOpen(false)} />}
    </>
  );
}

const STEPS = ['Upload to S3', 'Textract analysis', 'Match to ledger', 'Done'];

export function UploadModal({ txnId, onClose }: { txnId?: string; onClose: () => void }) {
  const { db, dispatch, user } = useStore();
  const { scope } = useScope();
  const unsupported = db.transactions.filter((t) => t.evidenceIds.length === 0 && (scope === 'all' || t.grantId === scope));
  const pendingMs = db.milestones.filter((m) => (scope === 'all' || m.grantId === scope) && m.status !== 'Not started');
  const unverified = db.outcomes.filter((o) => scope === 'all' || o.grantId === scope).flatMap((o) => o.entries.filter((e) => !e.evidenceIds.length).map((e) => ({ o, e })));
  const [target, setTarget] = useState(txnId ? `T:${txnId}` : unsupported[0] ? `T:${unsupported[0].id}` : '');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<Evidence | null>(null);

  const run = () => {
    if (!file || !target) return;
    const [k, id, label] = target.split(':');
    const t = k === 'T' ? db.transactions.find((x) => x.id === id) : undefined;
    const o = k === 'O' ? db.outcomes.find((x) => x.id === id) : undefined;
    // A result's evidence also evidences the milestone that shares evidence with it.
    const m = k === 'M' ? db.milestones.find((x) => x.id === id) : o ? db.milestones.find((x) => x.grantId === o.grantId && x.evidenceIds.some((e) => o.entries.some((en) => en.evidenceIds.includes(e)))) : undefined;
    const kind: EvidenceKind = t ? (t.vendor === 'Riverbend payroll' ? 'Payroll register' : /\.(jpe?g|png|heic)$/i.test(file.name) ? 'Receipt' : 'Invoice') : 'Certificate';
    // Demo: Textract output is simulated by reading the matched ledger entry. Production calls AnalyzeExpense on the S3 object.
    const ev: Evidence = {
      id: `EV-${9000 + db.evidence.length}`,
      grantId: (t ?? m ?? o)!.grantId,
      filename: file.name,
      kind,
      uploaded: new Date().toISOString().slice(0, 10),
      uploadedBy: user.name,
      extraction: t ? 'Textract' : 'Manual',
      extracted: t ? { vendor: t.vendor, date: t.date, total: t.amount, note: 'Simulated extraction (demo mode)' } : { note: 'Awaiting reviewer confirmation of contents (demo mode)' },
      supports: [...(m ? [m.id] : []), ...(o ? [o.id] : [])],
    };
    STEPS.forEach((_, i) => setTimeout(() => {
      setStep(i);
      if (i === STEPS.length - 1) { dispatch({ type: 'addEvidence', evidence: ev, linkTxnId: t?.id, linkMilestoneId: m?.id, linkOutcome: o ? { id: o.id, label } : undefined }); setResult(ev); }
    }, 450 * (i + 1)));
    setStep(0);
  };

  return (
    <Modal title="Upload evidence" onClose={onClose}>
      {result ? (
        <div className="stack">
          <div className="callout ok"><strong>{result.id}</strong> stored and linked. Related gaps have been re-evaluated.</div>
          <div className="small muted">Extracted: {result.extracted?.vendor} {result.extracted?.total !== undefined && usd(result.extracted.total)} {result.extracted?.note}</div>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="stack">
          <div className="field">
            <label>Link to</label>
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
              <optgroup label="Transactions without support">
                {unsupported.map((t) => <option key={t.id} value={`T:${t.id}`}>{t.id} · {t.description} · {usd(t.amount)}</option>)}
              </optgroup>
              <optgroup label="Unverified results">
                {unverified.map(({ o, e }) => <option key={o.id + e.label} value={`O:${o.id}:${e.label}`}>{o.metric} · {e.label} ({e.value})</option>)}
              </optgroup>
              <optgroup label="Milestones">
                {pendingMs.map((m) => <option key={m.id} value={`M:${m.id}`}>{m.id} · {m.title}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="field">
            <label>File (PDF, JPG, PNG)</label>
            <input type="file" className="input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <span className="small muted">Demo mode: the file is not uploaded anywhere; only its name is recorded.</span>
          </div>
          {step >= 0 && <div className="steps">{STEPS.map((s, i) => <span key={s} className={`st ${i < step ? 'done' : i === step ? 'on' : ''}`}>{s}</span>)}</div>}
          <button className="btn btn-primary" disabled={!file || !target || step >= 0} onClick={run}>Upload & extract</button>
        </div>
      )}
    </Modal>
  );
}
