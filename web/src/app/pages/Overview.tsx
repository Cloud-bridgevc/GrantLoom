import { Link } from 'react-router-dom';
import { Bar, PageHead, SevBadge, Stat, Status } from '../../components/ui';
import { TODAY } from '../../data/demo';
import { detectGaps, elapsedFraction, grantTxns, sum } from '../../engine/analysis';
import { daysBetween, fmtDate, pct, usd } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';
import { deadlines } from './Calendar';

export function OverviewPage() {
  const { db } = useStore();
  const { scope, setScope } = useScope();
  const grants = db.grants.filter((g) => scope === 'all' || g.id === scope);
  const gaps = detectGaps(db, scope === 'all' ? undefined : scope);
  const spend = sum(grants.flatMap((g) => grantTxns(db, g.id)));
  const award = sum(grants.map((g) => ({ amount: g.award })));
  const dl = deadlines(db).filter((d) => grants.some((g) => g.id === d.grantId) && d.date >= addDays(TODAY, -30) && d.status !== 'done').slice(0, 7);

  return (
    <>
      <PageHead title="Grant portfolio" sub={`Riverbend Community Health Collective · as of ${fmtDate(TODAY)}`} />
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Stat label="Active grants" value={grants.length} sub={`${new Set(grants.map((g) => g.funderId)).size} funders`} />
        <Stat label="Total awarded" value={usd(award)} sub="Per signed agreements" />
        <Stat label="Recorded expenditure" value={usd(spend)} sub={`${pct(spend / award)} of awards · from transaction register`} />
        <Stat label="Open compliance gaps" value={<span style={{ color: 'var(--red)' }}>{gaps.length}</span>} sub={`${gaps.filter((g) => g.severity === 'critical').length} critical`} />
      </div>

      <div className="grid g3" style={{ marginBottom: 20 }}>
        {grants.map((g) => {
          const f = db.funders.find((x) => x.id === g.funderId)!;
          const s = sum(grantTxns(db, g.id));
          const gg = gaps.filter((x) => x.grantId === g.id);
          const el = elapsedFraction(g, TODAY);
          return (
            <div className="card" key={g.id} style={{ cursor: 'pointer' }} onClick={() => setScope(g.id)}>
              <div className="spread"><span className="badge gold">{g.useCase === 'Research' ? 'Research' : g.useCase === 'NGO' ? 'Program' : 'Youth'}</span><span className="small muted mono">{g.code}</span></div>
              <h3 style={{ marginTop: 10 }}>{g.title}</h3>
              <div className="small muted" style={{ marginBottom: 12 }}>{f.name} · {fmtDate(g.start)} – {fmtDate(g.end)}</div>
              <div className="spread small"><span>Spent {usd(s)} of {usd(g.award)}</span><span className="muted">{pct(el)} of period elapsed</span></div>
              <div style={{ margin: '6px 0 12px' }}><Bar value={s / g.award} marker={el} /></div>
              <div className="row small">
                {(['critical', 'major', 'minor'] as const).map((sv) => {
                  const n = gg.filter((x) => x.severity === sv).length;
                  return n ? <span key={sv} className={`badge ${sv === 'critical' ? 'bad' : sv === 'major' ? 'warn' : 'navy'}`}>{n} {sv}</span> : null;
                })}
                {!gg.length && <span className="badge ok">No gaps</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="spread"><h3>Reporting & milestone deadlines</h3><Link to="/app/calendar" className="small">Calendar →</Link></div>
          <div className="table-wrap" style={{ marginTop: 10, border: 'none' }}>
            <table>
              <tbody>
                {dl.map((d) => {
                  const days = daysBetween(TODAY, d.date);
                  return (
                    <tr key={d.key}>
                      <td style={{ width: 110 }}><strong>{fmtDate(d.date)}</strong><div className="small muted">{days < 0 ? `${-days} days overdue` : `in ${days} days`}</div></td>
                      <td>{d.title}<div className="small muted">{db.grants.find((g) => g.id === d.grantId)!.code} · {d.kind}</div></td>
                      <td className="num">{days < 0 ? <span className="badge bad">Overdue</span> : <Status s={d.state} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="spread"><h3>Critical gaps</h3><Link to="/app/compliance" className="small">Checklist →</Link></div>
          <div className="stack" style={{ marginTop: 12 }}>
            {gaps.filter((g) => g.severity === 'critical').slice(0, 6).map((g) => (
              <div key={g.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <SevBadge s={g.severity} />
                <div><div style={{ fontWeight: 500 }}>{g.title}</div><div className="small muted">{g.fix}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
