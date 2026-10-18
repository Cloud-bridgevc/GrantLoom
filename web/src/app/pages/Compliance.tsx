import { useState } from 'react';
import { Cite, PageHead, SevBadge } from '../../components/ui';
import { detectGaps, type Severity } from '../../engine/analysis';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';

export function CompliancePage() {
  const { db } = useStore();
  const { scope } = useScope();
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const all = detectGaps(db, scope === 'all' ? undefined : scope);
  const gaps = all.filter((g) => sev === 'all' || g.severity === sev);
  const kinds = [...new Set(gaps.map((g) => g.kind))];

  return (
    <>
      <PageHead title="Compliance checklist" sub="Gaps are recomputed from current records every time. They clear automatically when the underlying record is fixed." />
      <div className="row" style={{ marginBottom: 16 }}>
        {(['all', 'critical', 'major', 'minor'] as const).map((s) => (
          <button key={s} className={`btn btn-sm ${sev === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSev(s)}>
            {s === 'all' ? 'All' : s} ({s === 'all' ? all.length : all.filter((g) => g.severity === s).length})
          </button>
        ))}
      </div>
      {!gaps.length && <div className="callout ok">No open gaps for this selection.</div>}
      {kinds.map((k) => (
        <div key={k} style={{ marginBottom: 22 }}>
          <h3>{k}</h3>
          <div className="table-wrap">
            <table>
              <tbody>
                {gaps.filter((g) => g.kind === k).map((g) => (
                  <tr key={g.id}>
                    <td style={{ width: 28 }}><input type="checkbox" disabled title="Clears automatically when the record is fixed" /></td>
                    <td style={{ width: 80 }}><SevBadge s={g.severity} /></td>
                    <td><strong>{g.title}</strong><div className="small muted">{g.detail}</div><div className="small" style={{ color: 'var(--green-700)' }}>→ {g.fix}</div></td>
                    <td className="mono small">{db.grants.find((x) => x.id === g.grantId)!.code}</td>
                    <td>{g.refs.map((r) => <Cite key={r} id={r} grantId={g.grantId} />)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
