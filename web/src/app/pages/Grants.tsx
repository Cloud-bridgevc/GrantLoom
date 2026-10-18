import { PageHead, Status } from '../../components/ui';
import { detectGaps, grantTxns, sum } from '../../engine/analysis';
import { fmtDate, usd } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';

export function GrantsPage() {
  const { db } = useStore();
  const { scope, setScope } = useScope();
  const grants = db.grants.filter((g) => scope === 'all' || g.id === scope);
  return (
    <>
      <PageHead title="Funders & grants" sub="Funder relationships and the grant records created from signed agreements." />
      <h3>Funders</h3>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead><tr><th>Funder</th><th>Type</th><th>Contact</th><th>Submission channel</th><th className="num">Active grants</th><th className="num">Awarded</th></tr></thead>
          <tbody>
            {db.funders.map((f) => {
              const gs = db.grants.filter((g) => g.funderId === f.id);
              return <tr key={f.id}><td><strong>{f.name}</strong></td><td>{f.type}</td><td>{f.contact}</td><td>{f.portal}</td><td className="num">{gs.length}</td><td className="num">{usd(sum(gs.map((g) => ({ amount: g.award }))))}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h3>Grants</h3>
      <div className="stack">
        {grants.map((g) => {
          const f = db.funders.find((x) => x.id === g.funderId)!;
          const doc = db.documents.find((d) => d.grantId === g.id);
          const reqs = db.requirements.filter((r) => r.grantId === g.id);
          const spent = sum(grantTxns(db, g.id));
          return (
            <div key={g.id} className="card">
              <div className="spread">
                <div>
                  <div className="small muted mono">{g.code}</div>
                  <h3>{g.title}</h3>
                  <div className="small muted">{f.name} · {fmtDate(g.start)} – {fmtDate(g.end)} · Lead: {g.programLead}</div>
                </div>
                <div className="row"><Status s={g.status === 'Active' ? 'met' : 'partial'} /><button className="btn btn-ghost btn-sm" onClick={() => setScope(g.id)}>Focus workspace</button></div>
              </div>
              <div className="grid g4" style={{ marginTop: 16 }}>
                <div><div className="small muted">Award</div><strong>{usd(g.award)}</strong></div>
                <div><div className="small muted">Recorded spend</div><strong>{usd(spent)}</strong></div>
                <div><div className="small muted">Requirements</div><strong>{reqs.length}</strong> <span className="small muted">({reqs.filter((r) => r.reviewed === 'pending').length} pending review)</span></div>
                <div><div className="small muted">Open gaps</div><strong>{detectGaps(db, g.id).length}</strong></div>
              </div>
              <div className="row small" style={{ marginTop: 14 }}>
                <span className="muted">Source agreement:</span> <span className="mono">{doc?.filename}</span> <span className="muted">· {doc?.pages} pages · uploaded {doc && fmtDate(doc.uploaded)} · s3://grantloom-docs/riverbend/{g.id}/</span>
              </div>
              <div className="row" style={{ marginTop: 10 }}>{g.budget.map((b) => <span key={b.category} className="badge">{b.category} {usd(b.amount)}</span>)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
