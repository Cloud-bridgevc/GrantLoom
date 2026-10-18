import { useState } from 'react';
import { Cite, PageHead, SevBadge } from '../../components/ui';
import { detectGaps, sum } from '../../engine/analysis';
import { fmtDate, usd } from '../../engine/format';
import { useStore } from '../../engine/store';
import { useScope } from '../AppShell';
import { UploadModal } from './Evidence';

export function ExpendituresPage() {
  const { db, user } = useStore();
  const { scope } = useScope();
  const [filter, setFilter] = useState<'all' | 'flagged' | 'unsupported'>('all');
  const [q, setQ] = useState('');
  const [upload, setUpload] = useState<string | null>(null);
  const gaps = detectGaps(db, scope === 'all' ? undefined : scope);
  const flagsFor = (id: string) => gaps.filter((g) => g.refs[0] === id);

  if (user.role === 'viewer') {
    return <><PageHead title="Expenditure register" /><div className="callout warn">Your role (read-only board observer) is not authorized to view transaction-level financial data.</div></>;
  }

  const rows = db.transactions
    .filter((t) => scope === 'all' || t.grantId === scope)
    .filter((t) => filter === 'all' || (filter === 'unsupported' ? t.evidenceIds.length === 0 : flagsFor(t.id).length > 0))
    .filter((t) => !q || `${t.id} ${t.vendor} ${t.description} ${t.category}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHead title="Expenditure register" sub="Every financial figure in GrantLoom is computed from these recorded transactions." />
      <div className="spread" style={{ marginBottom: 14 }}>
        <div className="row">
          {(['all', 'flagged', 'unsupported'] as const).map((f) => <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'flagged' ? 'Flagged' : 'No receipt'}</button>)}
          <input className="input" style={{ width: 220 }} placeholder="Search vendor, ID, description" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="small muted">{rows.length} transactions · <strong style={{ color: 'var(--navy)' }}>{usd(sum(rows))}</strong></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Grant</th><th>Vendor / description</th><th>Budget line</th><th className="num">Amount</th><th>Support</th><th>Flags</th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const fl = flagsFor(t.id);
              return (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                  <td className="mono small">{db.grants.find((g) => g.id === t.grantId)!.code}</td>
                  <td><strong>{t.vendor}</strong><div className="small muted">{t.description}</div></td>
                  <td className="small">{t.category}</td>
                  <td className="num">{usd(t.amount)}</td>
                  <td>
                    {t.evidenceIds.length ? t.evidenceIds.map((e) => <Cite key={e} id={e} />) : (
                      <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => setUpload(t.id)}>Upload</button>
                    )}
                    {t.quoteIds?.length ? <div className="small muted">{t.quoteIds.length} quote(s)</div> : null}
                  </td>
                  <td>{fl.map((g) => <div key={g.id} className="row small" style={{ flexWrap: 'nowrap', marginBottom: 4 }}><SevBadge s={g.severity} /><span>{g.kind}</span></div>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {upload && <UploadModal txnId={upload} onClose={() => setUpload(null)} />}
    </>
  );
}
