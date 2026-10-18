import { Fragment, useState } from 'react';
import { Bar, Cite, PageHead, Stat } from '../../components/ui';
import { TODAY } from '../../data/demo';
import { elapsedFraction, sum, variance } from '../../engine/analysis';
import { fmtDate, fmtDateTime, pct, usd } from '../../engine/format';
import { useStore } from '../../engine/store';
import { GrantPicker, useSingleGrant } from '../AppShell';

export function BudgetPage() {
  const { db, dispatch, user } = useStore();
  const { grantId, setGrantId, pick } = useSingleGrant();
  const g = db.grants.find((x) => x.id === grantId)!;
  const lines = variance(db, grantId);
  const varReq = db.requirements.find((r) => r.grantId === grantId && r.type === 'Variance');
  const [open, setOpen] = useState<string | null>(lines.find((l) => l.material)?.category ?? null);
  const [draft, setDraft] = useState('');
  const canWrite = user.role === 'finance' || user.role === 'approver';
  const total = sum(lines.map((l) => ({ amount: l.actual })));

  return (
    <>
      <PageHead title="Budget & variance intelligence" sub={`Recorded spend vs. pro-rata budget. Materiality threshold: ${varReq ? `10% (${varReq.source.clause})` : '10% (default)'}.`} actions={pick && <GrantPicker grantId={grantId} setGrantId={setGrantId} />} />
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Stat label="Approved budget" value={usd(g.award)} />
        <Stat label="Recorded spend" value={usd(total)} sub={`${pct(total / g.award)} used`} />
        <Stat label="Period elapsed" value={pct(elapsedFraction(g, TODAY))} sub={`as of ${fmtDate(TODAY)}`} />
        <Stat label="Material variances" value={lines.filter((l) => l.material).length} sub={`${lines.filter((l) => l.material && !l.recordedNote).length} without explanation`} />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Budget line</th><th className="num">Approved</th><th className="num">Spent</th><th className="num">Pro-rata</th><th style={{ width: 180 }}>Used (▏ = time elapsed)</th><th className="num">Variance</th><th>Explanation</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <Fragment key={l.category}>
                <tr className="clickable" onClick={() => { setOpen(open === l.category ? null : l.category); setDraft(''); }}>
                  <td><strong>{l.category}</strong></td>
                  <td className="num">{usd(l.budget)}</td>
                  <td className="num">{usd(l.actual)}</td>
                  <td className="num">{usd(l.expected)}</td>
                  <td><Bar value={l.usedPct} marker={elapsedFraction(g, TODAY)} over={l.overBudget} /><div className="small muted">{pct(l.usedPct)}</div></td>
                  <td className="num"><span className={`badge ${l.reallocationRisk ? 'bad' : l.material ? 'warn' : 'ok'}`}>{l.variancePct > 0 ? '+' : ''}{pct(l.variancePct)}</span></td>
                  <td>{l.material ? (l.recordedNote ? <span className="badge ok">Recorded</span> : <span className="badge bad">Required</span>) : <span className="small muted">Not required</span>}</td>
                </tr>
                {open === l.category && (
                  <tr>
                    <td colSpan={7} style={{ background: '#fbf9f3' }}>
                      <div className="grid g2">
                        <div>
                          <div className="eyebrow" style={{ marginBottom: 6 }}>Variance analysis · from records</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>{l.explanation.map((e, i) => <li key={i} className="small">{e}</li>)}</ul>
                          {l.reallocationRisk && <div className="callout bad small" style={{ marginTop: 10 }}>This line is more than 15% over its approved amount. Under the reallocation clause, prior written funder approval is required. None is on file.</div>}
                          <div className="row" style={{ marginTop: 10 }}>{l.drivers.slice(0, 8).map((t) => <Cite key={t.id} id={t.id} />)}</div>
                        </div>
                        <div>
                          <div className="eyebrow" style={{ marginBottom: 6 }}>Written explanation (human-authored)</div>
                          {l.recordedNote ? (
                            <div className="callout ok small">{l.recordedNote.note}<div className="muted" style={{ marginTop: 6 }}>— {l.recordedNote.by}, {fmtDateTime(l.recordedNote.at)}</div></div>
                          ) : l.material ? (
                            canWrite ? (
                              <>
                                <textarea className="input" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Explain the reason for this variance. GrantLoom does not write this for you — it must reflect what actually happened." />
                                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} disabled={draft.trim().length < 15} onClick={() => dispatch({ type: 'varianceNote', key: l.noteKey, note: draft.trim() })}>Record explanation</button>
                              </>
                            ) : <div className="callout warn small">Explanation required. Only the finance lead or approver can record it.</div>
                          ) : <div className="small muted">Within threshold.</div>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
