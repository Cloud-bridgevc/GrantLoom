import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Logo } from '../components/ui';
import { TODAY } from '../data/demo';
import { detectGaps } from '../engine/analysis';
import { fmtDate } from '../engine/format';
import { useStore } from '../engine/store';
import { AssistantPage } from './pages/Assistant';
import { AuditPage } from './pages/Audit';
import { CompliancePage } from './pages/Compliance';
import { MappingPage } from './pages/Mapping';
import { MilestonesPage } from './pages/Milestones';
import { RequirementsPage } from './pages/Requirements';
import { BudgetPage } from './pages/Budget';
import { CalendarPage } from './pages/Calendar';
import { EvidencePage } from './pages/Evidence';
import { ExpendituresPage } from './pages/Expenditures';
import { GrantsPage } from './pages/Grants';
import { OverviewPage } from './pages/Overview';
import { ReportsPage } from './pages/Reports';

const ScopeCtx = createContext<{ scope: string; setScope: (s: string) => void }>({ scope: 'all', setScope: () => {} });
export const useScope = () => useContext(ScopeCtx);
/** For pages that need one grant: the scoped grant, or the first grant when "All grants" is selected. */
export const useSingleGrant = () => {
  const { scope } = useScope();
  const { db } = useStore();
  const [local, setLocal] = useState(db.grants[0].id);
  return scope === 'all' ? { grantId: local, setGrantId: setLocal, pick: true } : { grantId: scope, setGrantId: () => {}, pick: false };
};

const NAV: [string, [string, string][]][] = [
  ['Portfolio', [['', 'Overview'], ['grants', 'Funders & grants'], ['calendar', 'Reporting calendar']]],
  ['Finance', [['budget', 'Budget & variance'], ['expenditures', 'Expenditure register'], ['evidence', 'Receipts & evidence']]],
  ['Compliance', [['requirements', 'Requirements (AI)'], ['mapping', 'Evidence mapping'], ['milestones', 'Milestones'], ['compliance', 'Compliance checklist']]],
  ['Reporting', [['reports', 'Reports & approval'], ['assistant', 'Grant assistant'], ['audit', 'Audit trail']]],
];

export default function AppShell() {
  const { db, dispatch, user } = useStore();
  const [scope, setScope] = useState('all');
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const critical = detectGaps(db, scope === 'all' ? undefined : scope).filter((g) => g.severity === 'critical').length;

  return (
    <ScopeCtx.Provider value={{ scope, setScope }}>
      <div className="demo-flag">Demonstration workspace · {fmtDate(TODAY)} · all organizations, people, documents and figures are fictional</div>
      <div className="shell">
        <aside className={`side ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <div style={{ padding: '4px 10px 8px' }}><Link to="/" style={{ textDecoration: 'none' }}><Logo light /></Link></div>
          <div className="small" style={{ padding: '0 10px', color: '#9fb6aa' }}>Riverbend Community Health Collective</div>
          {NAV.map(([grp, items]) => (
            <div key={grp}>
              <div className="grp">{grp}</div>
              {items.map(([path, label]) => (
                <NavLink key={path} to={`/app/${path}`} end={path === ''}>
                  {label}
                  {path === 'compliance' && critical > 0 && <span className="count">{critical}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <div className="main">
          <div className="topbar">
            <div className="row">
              <button className="btn btn-ghost btn-sm menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
              <select className="input" style={{ width: 'auto' }} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Grant scope">
                <option value="all">All grants ({db.grants.length})</option>
                {db.grants.map((g) => <option key={g.id} value={g.id}>{g.code} · {g.title}</option>)}
              </select>
            </div>
            <div className="row">
              <label className="small muted" htmlFor="role">Signed in as</label>
              <select id="role" className="input" style={{ width: 'auto' }} value={user.id} onChange={(e) => dispatch({ type: 'setUser', userId: e.target.value })}>
                {db.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.title}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => confirm('Reset all demo data to its original state?') && dispatch({ type: 'reset' })}>Reset demo</button>
            </div>
          </div>
          <div className="content" key={loc.pathname}>
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="grants" element={<GrantsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="expenditures" element={<ExpendituresPage />} />
              <Route path="evidence" element={<EvidencePage />} />
              <Route path="requirements" element={<RequirementsPage />} />
              <Route path="mapping" element={<MappingPage />} />
              <Route path="milestones" element={<MilestonesPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportsPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="audit" element={<AuditPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </ScopeCtx.Provider>
  );
}

export function GrantPicker({ grantId, setGrantId }: { grantId: string; setGrantId: (g: string) => void }) {
  const { db } = useStore();
  return (
    <select className="input" style={{ width: 'auto' }} value={grantId} onChange={(e) => setGrantId(e.target.value)} aria-label="Grant">
      {db.grants.map((g) => <option key={g.id} value={g.id}>{g.code} · {g.title}</option>)}
    </select>
  );
}
