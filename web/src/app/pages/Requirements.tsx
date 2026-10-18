import { useState } from 'react';
import { PageHead, Status } from '../../components/ui';
import { fmtDate, pct } from '../../engine/format';
import { useStore } from '../../engine/store';
import { GrantPicker, useSingleGrant } from '../AppShell';

const STEPS = ['Upload to S3', 'Textract: text & layout', 'Bedrock: structured extraction', 'Validate clause references', 'Queue for human review'];

export function RequirementsPage() {
  const { db, dispatch, user } = useStore();
  const { grantId, setGrantId, pick } = useSingleGrant();
  const doc = db.documents.find((d) => d.grantId === grantId)!;
  const reqs = db.requirements.filter((r) => r.grantId === grantId);
  const [hl, setHl] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const canReview = user.role === 'program' || user.role === 'finance' || user.role === 'approver';

  const rerun = () => {
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1 === STEPS.length ? STEPS.length : i + 1), 500 * (i + 1)));
    setStep(0);
  };

  return (
    <>
      <PageHead title="Grant requirement extraction" sub="Obligations, eligible costs, deadlines, milestones and evidence rules extracted from the agreement. Every item cites its clause and page, and stays pending until a person accepts it."
        actions={<>{pick && <GrantPicker grantId={grantId} setGrantId={setGrantId} />}<button className="btn btn-ghost" onClick={rerun} disabled={step >= 0 && step < STEPS.length}>↻ Re-run extraction</button></>} />
      {step >= 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="steps">{STEPS.map((s, i) => <span key={s} className={`st ${i < step ? 'done' : i === step ? 'on' : ''}`}>{s}</span>)}</div>
          {step === STEPS.length && <div className="small muted" style={{ marginTop: 8 }}>Demo mode: extraction re-validated {reqs.length} existing requirements against {doc.clauses.length} clauses; no changes found. Existing review decisions are kept.</div>}
        </div>
      )}
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}><span className="mono">{doc.filename}</span> · {doc.pages} pages · uploaded {fmtDate(doc.uploaded)}</div>
          <div className="doc-view">
            {doc.clauses.map((c) => (
              <div key={c.ref} id={`cl-${c.ref}`} className={`cl ${hl && hl.startsWith(c.ref) ? 'hl' : ''}`}>
                <div className="ref">p.{c.page} · {c.ref}</div>
                <strong>{c.heading}.</strong> {c.text}
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          {reqs.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }} onMouseEnter={() => setHl(r.source.clause)} onMouseLeave={() => setHl(null)}>
              <div className="spread">
                <div className="row"><span className="badge navy">{r.type}</span><span className="cite">{r.source.clause} · p.{r.source.page}</span></div>
                <Status s={r.reviewed} />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: 6 }}>{r.title}</div>
              <div className="small muted">{r.detail}</div>
              <div className="spread" style={{ marginTop: 8 }}>
                <span className="small muted">Confidence {pct(r.confidence)}{r.due ? ` · due ${fmtDate(r.due)}` : ''}</span>
                {canReview && r.reviewed !== 'accepted' && (
                  <div className="row">
                    <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'reviewRequirement', id: r.id, decision: 'accepted' })}>Accept</button>
                    {r.reviewed !== 'rejected' && <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reviewRequirement', id: r.id, decision: 'rejected' })}>Reject</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
