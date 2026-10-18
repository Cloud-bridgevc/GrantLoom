import { useState } from 'react';
import { PageHead } from '../../components/ui';
import { fmtDateTime } from '../../engine/format';
import { useStore } from '../../engine/store';

export function AuditPage() {
  const { db } = useStore();
  const [actor, setActor] = useState('All');
  const [q, setQ] = useState('');
  const actors = ['All', ...new Set(db.audit.map((a) => a.actor))];
  const rows = [...db.audit]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((a) => (actor === 'All' || a.actor === actor) && (!q || `${a.action} ${a.target} ${a.detail ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHead title="Audit trail" sub="Append-only record of uploads, AI actions, reviews, approvals and submissions." />
      <div className="row" style={{ marginBottom: 14 }}>
        <select className="input" style={{ width: 'auto' }} value={actor} onChange={(e) => setActor(e.target.value)}>{actors.map((a) => <option key={a}>{a}</option>)}</select>
        <input className="input" style={{ width: 260 }} placeholder="Filter by action, target or detail" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="small" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.at)}</td>
                <td>{a.actor === 'GrantLoom AI' ? <span className="badge gold">GrantLoom AI</span> : a.actor}</td>
                <td>{a.action}</td>
                <td className="mono small">{a.target}</td>
                <td className="small muted">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
