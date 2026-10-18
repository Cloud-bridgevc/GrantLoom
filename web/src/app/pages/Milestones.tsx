import { Cite, PageHead, Status } from '../../components/ui';
import { TODAY } from '../../data/demo';
import { daysBetween, fmtDate } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';

export function MilestonesPage() {
  const { db } = useStore();
  const { scope } = useScope();
  const grants = db.grants.filter((g) => scope === 'all' || g.id === scope);
  return (
    <>
      <PageHead title="Milestones & results" sub="Milestones from agreements, with evidence. Results are shown exactly as recorded; entries without evidence are labeled unverified." />
      {grants.map((g) => (
        <div key={g.id} style={{ marginBottom: 28 }}>
          <h3>{g.code} · {g.title}</h3>
          <div className="table-wrap" style={{ marginBottom: 12 }}>
            <table>
              <thead><tr><th>Milestone</th><th>Due</th><th>Status</th><th>Evidence</th></tr></thead>
              <tbody>
                {db.milestones.filter((m) => m.grantId === g.id).map((m) => {
                  const late = m.due < TODAY && (m.status === 'In progress' || m.status === 'Not started');
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.title}</strong><div className="small muted mono">{m.id}</div></td>
                      <td>{fmtDate(m.due)}<div className="small muted">{m.status === 'Complete' ? `done ${fmtDate(m.completed!)}` : late ? `${daysBetween(m.due, TODAY)} days overdue` : ''}</div></td>
                      <td><Status s={m.status} /></td>
                      <td>{m.evidenceIds.length ? m.evidenceIds.map((e) => <Cite key={e} id={e} />) : <span className="badge bad">None</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {db.outcomes.filter((o) => o.grantId === g.id).map((o) => {
            const ver = o.entries.filter((e) => e.evidenceIds.length).reduce((s, e) => s + e.value, 0);
            const unv = o.entries.filter((e) => !e.evidenceIds.length).reduce((s, e) => s + e.value, 0);
            return (
              <div key={o.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
                <div className="spread">
                  <strong>{o.metric}</strong>
                  <span><strong>{ver}</strong> verified{o.target ? ` / ${o.target} target` : ''}{unv > 0 && <span className="unverified" style={{ marginLeft: 8 }}>+{unv} unverified</span>}</span>
                </div>
                <div className="row small" style={{ marginTop: 6 }}>
                  {o.entries.map((e) => <span key={e.label} className={e.evidenceIds.length ? 'badge ok' : 'badge warn'}>{e.label}: {e.value} {e.evidenceIds.length ? `· ${e.evidenceIds.join(', ')}` : '· no evidence'}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
