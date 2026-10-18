import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHead, Segs, SevBadge, Status } from '../../components/ui';
import { draftReport } from '../../engine/analysis';
import { fmtDate, fmtDateTime } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';

export function ReportsPage() {
  const { id } = useParams();
  const { db } = useStore();
  const { scope } = useScope();
  if (id) return <ReportDetail id={id} />;
  const reps = db.reports.filter((r) => scope === 'all' || r.grantId === scope);
  return (
    <>
      <PageHead title="Reports & approval" sub="Drafts are built from verified records. Only an authorized signatory can approve, and submission can be recorded only after approval." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Report</th><th>Grant</th><th>Period</th><th>Due</th><th>Status</th><th>Approval</th></tr></thead>
          <tbody>
            {reps.map((r) => (
              <tr key={r.id}>
                <td><Link to={`/app/reports/${r.id}`}><strong>{r.title}</strong></Link><div className="small muted mono">{r.id}</div></td>
                <td className="mono small">{db.grants.find((g) => g.id === r.grantId)!.code}</td>
                <td className="small">{fmtDate(r.period.from)} – {fmtDate(r.period.to)}</td>
                <td>{fmtDate(r.due)}</td>
                <td><Status s={r.status} /></td>
                <td className="small">{r.approvedBy ? `${r.approvedBy}, ${fmtDateTime(r.approvedAt!)}` : <span className="muted">Not approved</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportDetail({ id }: { id: string }) {
  const { db, dispatch, user } = useStore();
  const rep = db.reports.find((r) => r.id === id);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [attest, setAttest] = useState(false);
  const [channel, setChannel] = useState('');
  if (!rep) return <p>Report not found.</p>;
  const g = db.grants.find((x) => x.id === rep.grantId)!;
  const draft = draftReport(db, rep.id);
  const critical = draft.gaps.filter((x) => x.severity === 'critical');
  const unacked = critical.filter((x) => !rep.acknowledgedGaps.some((a) => a.gapId === x.id));
  const canEdit = user.role === 'program' || user.role === 'finance';
  const isApprover = user.role === 'approver';
  const hasDraft = rep.status !== 'Not started';

  return (
    <>
      <PageHead title={rep.title} sub={<>{g.code} · {g.title} · due {fmtDate(rep.due)} · <Status s={rep.status} /></>}
        actions={<Link to="/app/reports" className="btn btn-ghost btn-sm">← All reports</Link>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20 }} className="rep-grid">
        <div>
          {!hasDraft ? (
            <div className="card"><p>No draft yet.</p>{canEdit && <button className="btn btn-primary" onClick={() => dispatch({ type: 'generateReport', id: rep.id, summary: `Draft built from records; ${draft.gaps.length} gaps flagged` })}>Generate draft from records</button>}</div>
          ) : (
            <div className="draft">
              <div className="spread"><span className="watermark">{rep.status === 'Submitted' ? 'Submitted copy' : rep.status === 'Approved' ? 'Approved · not yet submitted' : 'Draft · not approved'}</span><span className="small muted" style={{ fontFamily: 'var(--sans)' }}>{draft.sourcesUsed.length} sources cited · hover a reference to see it</span></div>
              {draft.sections.map((s) => (
                <div key={s.heading}>
                  <h4>{s.heading}</h4>
                  {s.paras.map((p, i) => <p key={i}><Segs segs={p} grantId={g.id} /></p>)}
                  {s.table && (
                    <div className="table-wrap"><table>
                      <thead><tr>{s.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'num' : ''}>{typeof c === 'string' ? c : <Segs segs={c} grantId={g.id} />}</td>)}</tr>)}</tbody>
                    </table></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="stack">
          <div className="card">
            <h3>Workflow</h3>
            <div className="steps" style={{ margin: '8px 0 14px' }}>{['Draft', 'In review', 'Approved', 'Submitted'].map((s) => <span key={s} className={`st ${s === rep.status ? 'on' : ''}`}>{s}</span>)}</div>
            {rep.status === 'Draft' && canEdit && (
              <div className="row"><button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'generateReport', id: rep.id, summary: 'Regenerated from current records' })}>Regenerate</button><button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'sendForReview', id: rep.id })}>Send for approval</button></div>
            )}
            {rep.status === 'In review' && (isApprover ? (
              <div className="stack">
                {unacked.length > 0 && <div className="callout bad small">{unacked.length} critical gap(s) must be acknowledged in writing before approval.</div>}
                <label className="small row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} style={{ marginTop: 4 }} /><span>I am the authorized signatory. I have reviewed this report against its sources, and labeled gaps are disclosed.</span></label>
                <div className="row">
                  <button className="btn btn-primary btn-sm" disabled={!attest || unacked.length > 0} onClick={() => dispatch({ type: 'approveReport', id: rep.id })}>Approve report</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'returnToDraft', id: rep.id, reason: 'Returned by approver for corrections' })}>Return to draft</button>
                </div>
              </div>
            ) : <div className="callout info small">Awaiting approval by the authorized signatory (switch user to Dr. Leila Haddad to approve).</div>)}
            {rep.status === 'Approved' && user.role !== 'viewer' && (
              <div className="stack">
                <div className="small muted">GrantLoom does not send reports. After submitting through the funder's channel, record it here.</div>
                <input className="input" placeholder="e.g. Uploaded to Harrowgate grantee portal" value={channel} onChange={(e) => setChannel(e.target.value)} />
                <button className="btn btn-gold btn-sm" disabled={channel.trim().length < 5} onClick={() => dispatch({ type: 'recordSubmission', id: rep.id, channel: channel.trim() })}>Record submission</button>
              </div>
            )}
            {rep.status === 'Submitted' && <div className="small">Submitted {fmtDateTime(rep.submittedAt!)}. Funder acknowledgement: <strong>{rep.funderAcknowledgement ?? 'not recorded'}</strong>.</div>}
          </div>
          {hasDraft && (
            <div className="card">
              <h3>Gaps in this report ({draft.gaps.length})</h3>
              <div className="stack" style={{ marginTop: 10 }}>
                {draft.gaps.map((x) => {
                  const ack = rep.acknowledgedGaps.find((a) => a.gapId === x.id);
                  return (
                    <div key={x.id} className="small">
                      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><SevBadge s={x.severity} /><span><strong>{x.title}</strong><div className="muted">{x.fix}</div></span></div>
                      {x.severity === 'critical' && (ack ? <div className="callout ok" style={{ marginTop: 6 }}>Acknowledged by {ack.by}: {ack.note}</div> : isApprover && rep.status === 'In review' && (
                        <div className="row" style={{ marginTop: 6, flexWrap: 'nowrap' }}>
                          <input className="input" placeholder="How is this disclosed / handled?" value={notes[x.id] ?? ''} onChange={(e) => setNotes({ ...notes, [x.id]: e.target.value })} />
                          <button className="btn btn-ghost btn-sm" disabled={(notes[x.id] ?? '').trim().length < 10} onClick={() => dispatch({ type: 'acknowledgeGap', id: rep.id, gapId: x.id, note: notes[x.id].trim() })}>Ack</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 1000px){ .rep-grid{ grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </>
  );
}
