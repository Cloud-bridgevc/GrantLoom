import { useState } from 'react';
import { PageHead, Status } from '../../components/ui';
import { TODAY } from '../../data/demo';
import { fmtDate } from '../../engine/format';
import { useStore, type DB } from '../../engine/store';
import { useScope } from '../AppShell';

export interface Deadline { key: string; date: string; title: string; grantId: string; kind: 'Report' | 'Milestone'; state: string; status: 'done' | 'open' }

export function deadlines(db: DB): Deadline[] {
  const out: Deadline[] = [];
  for (const r of db.requirements.filter((x) => x.type === 'Reporting' && x.due && x.reviewed !== 'rejected')) {
    const rep = db.reports.find((x) => x.requirementId === r.id);
    out.push({ key: r.id, date: r.due!, title: r.title, grantId: r.grantId, kind: 'Report', state: rep?.status ?? 'Not started', status: rep?.status === 'Submitted' ? 'done' : 'open' });
  }
  for (const m of db.milestones) {
    out.push({ key: m.id, date: m.due, title: m.title, grantId: m.grantId, kind: 'Milestone', state: m.status, status: m.status === 'Complete' ? 'done' : 'open' });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function CalendarPage() {
  const { db } = useStore();
  const { scope } = useScope();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const all = deadlines(db).filter((d) => scope === 'all' || d.grantId === scope);
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startPad + days) / 7) * 7 }, (_, i) => i - startPad + 1);
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const iso = (d: number) => `${month}-${String(d).padStart(2, '0')}`;

  return (
    <>
      <PageHead title="Reporting calendar" sub="Deadlines extracted from agreements plus milestone due dates. Reminders are sent by a scheduled AWS Lambda at 30, 14, 7 and 1 days out."
        actions={<><button className="btn btn-ghost btn-sm" onClick={() => shift(-1)}>←</button><strong style={{ minWidth: 130, textAlign: 'center' }}>{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong><button className="btn btn-ghost btn-sm" onClick={() => shift(1)}>→</button></>} />
      <div className="cal" style={{ marginBottom: 24 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="dow">{d}</div>)}
        {cells.map((d, i) => {
          const inMonth = d >= 1 && d <= days;
          const items = inMonth ? all.filter((x) => x.date === iso(d)) : [];
          return (
            <div key={i} className={`${inMonth ? '' : 'off'} ${inMonth && iso(d) === TODAY ? 'today' : ''}`}>
              {inMonth && <div>{d}</div>}
              {items.map((x) => (
                <span key={x.key} title={`${x.title} · ${db.grants.find((g) => g.id === x.grantId)!.code} · ${x.state}`} className={`ev ${x.status === 'open' && x.date < TODAY ? 'overdue' : x.kind === 'Report' ? 'report' : 'milestone'}`}>
                  {x.kind === 'Report' ? '▣ ' : '◆ '}{x.title}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Obligation</th><th>Grant</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            {all.map((x) => (
              <tr key={x.key}>
                <td>{fmtDate(x.date)}</td><td>{x.title}</td><td className="mono">{db.grants.find((g) => g.id === x.grantId)!.code}</td><td>{x.kind}</td>
                <td>{x.status === 'open' && x.date < TODAY ? <span className="badge bad">Overdue · {x.state}</span> : <Status s={x.state} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
