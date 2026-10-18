import { PageHead, Status } from '../../components/ui';
import { mapEvidence } from '../../engine/analysis';
import { pct } from '../../engine/format';
import { useStore } from '../../engine/store';
import { GrantPicker, useSingleGrant } from '../AppShell';

export function MappingPage() {
  const { db, dispatch, user } = useStore();
  const { grantId, setGrantId, pick } = useSingleGrant();
  const rows = mapEvidence(db, grantId);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const canDecide = user.role !== 'viewer';

  return (
    <>
      <PageHead title="Evidence mapping" sub="Each accepted requirement linked to the receipts, registers, certificates, milestones and reports that satisfy it. Confirm or reject AI-proposed links."
        actions={pick && <GrantPicker grantId={grantId} setGrantId={setGrantId} />} />
      <div className="row" style={{ marginBottom: 16 }}>
        <span className="badge ok">{count('met')} met</span><span className="badge warn">{count('partial')} partial</span>
        <span className="badge bad">{count('missing') + count('violation')} missing / violation</span><span className="badge navy">{count('upcoming')} upcoming</span>
      </div>
      <div className="stack">
        {rows.map((row) => (
          <div key={row.requirement.id} className="card" style={{ padding: 16 }}>
            <div className="spread">
              <div className="row"><span className="cite">{row.requirement.source.clause}</span><strong style={{ color: 'var(--navy)' }}>{row.requirement.title}</strong></div>
              <Status s={row.status} />
            </div>
            <div className="small muted" style={{ margin: '4px 0 8px' }}>{row.summary}</div>
            {row.links.length > 0 && (
              <details>
                <summary className="small" style={{ cursor: 'pointer', color: 'var(--green-700)' }}>{row.links.length} linked item(s)</summary>
                <div className="table-wrap" style={{ marginTop: 8 }}>
                  <table>
                    <tbody>
                      {row.links.map((l) => (
                        <tr key={l.id + l.label}>
                          <td className="small"><span className="mono">{l.label}</span><div className="muted">{l.reason}</div></td>
                          <td className="num small">{pct(l.confidence)}</td>
                          <td className="num" style={{ width: 170 }}>
                            {l.decision ? <Status s={l.decision} /> : canDecide && (l.kind === 'evidence') ? (
                              <div className="row" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'mapping', decision: { requirementId: row.requirement.id, itemId: l.id, decision: 'confirmed' } })}>✓</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'mapping', decision: { requirementId: row.requirement.id, itemId: l.id, decision: 'rejected' } })}>✕</button>
                              </div>
                            ) : <span className="small muted">system</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
