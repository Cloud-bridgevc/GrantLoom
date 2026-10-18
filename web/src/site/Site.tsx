import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
import { useStore } from '../engine/store';
import EvidenceDemo from './EvidenceDemo';

const FEATURES = [
  ['Requirement extraction', 'Upload a grant agreement. GrantLoom extracts reporting obligations, eligible costs, deadlines, milestones and evidence rules — each tied to its clause and page, and queued for human review.'],
  ['Evidence mapping', 'Receipts, invoices, payroll registers, certificates and attendance sheets are linked to the requirements they satisfy, with a confidence score you can confirm or reject.'],
  ['Reporting gap detection', 'Missing receipts, amount mismatches, prohibited costs, absent quotations, unverified results and overdue milestones surface long before the report is due.'],
  ['Report drafting', 'Funder report drafts built only from verified records. Every figure carries a source reference; anything missing is labeled missing, not filled in.'],
  ['Budget variance intelligence', 'Spending is compared with pro-rata budgets by line. Material variances are explained using the transactions that drive them — and the finance lead records the reason.'],
  ['Grant assistant', 'Ask “Can we charge refreshments?” or “What’s due in November?” and get an answer quoted from your agreement and records — or a clear “not in the sources.”'],
];

const USE_CASES = {
  NGO: {
    title: 'Community NGOs',
    lead: 'Small finance teams juggling several restricted grants with different rules, calendars and evidence expectations.',
    points: ['One expenditure register mapped to every funder’s budget lines', 'Receipt capture from phone photos with Textract extraction', 'Field evidence — attendance sheets, certificates, photos — linked to milestones', 'Board-ready portfolio view of deadlines and compliance risk'],
    example: 'A water-access program spots an ineligible catering line item and a missing payroll register three weeks before its quarterly report.',
  },
  Foundation: {
    title: 'Foundations & funders',
    lead: 'Program teams who want grantees to report accurately and want to see the evidence behind the numbers.',
    points: ['Share structured requirements with grantees at award', 'Receive reports with source references to underlying records', 'Consistent variance thresholds and prior-approval checks', 'Portfolio-level view of reporting timeliness'],
    example: 'A civic fund sees that a six-month report is overdue and which cohort evidence is still outstanding.',
  },
  Research: {
    title: 'Research institutions',
    lead: 'Sponsored-research offices managing multi-year awards, ethics conditions and staged data-collection milestones.',
    points: ['Ethics approval and data-management conditions tracked as requirements', 'Multi-year budgets with annual progress reporting', 'Effort and payroll registers linked to research staff lines', 'Open-access and dissemination obligations on the calendar'],
    example: 'A literacy study confirms its ethics letter predates fieldwork and that Q3 staff costs still need a payroll register.',
  },
} as const;

const PLANS = [
  { name: 'Community', price: '$149', per: '/month', for: 'Small NGOs with a few active grants', items: ['Up to 5 active grants', 'Requirement extraction & review', 'Receipt and evidence library (25 GB)', 'Gap detection & reporting calendar', '3 users, 1 approver'], cta: 'Request a demo' },
  { name: 'Organization', price: '$449', per: '/month', for: 'Growing teams and multi-funder portfolios', items: ['Up to 25 active grants', 'Everything in Community', 'AI report drafting with source references', 'Budget variance intelligence', 'Grant assistant', 'Unlimited users, approval workflows'], cta: 'Request a demo', featured: true },
  { name: 'Institution', price: 'Custom', per: '', for: 'Research institutions, foundations & consultancies', items: ['Unlimited grants & entities', 'SSO and role-based access', 'Regional data residency on AWS', 'Accounting system integration', 'Dedicated onboarding'], cta: 'Talk to us' },
];

export default function Site() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [tab, setTab] = useState<keyof typeof USE_CASES>('NGO');
  const uc = USE_CASES[tab];
  return (
    <div className="site">
      <header className="site-nav">
        <div className="wrap">
          <Logo />
          <nav>
            <a href="#features">Platform</a>
            <a href="#use-cases">Use cases</a>
            <a href="#demo">Evidence mapping</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="row">
            <Link to="/app" className="btn btn-ghost btn-sm">Open live demo</Link>
            <a href="#request" className="btn btn-primary btn-sm">Request a demo</a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Grant management · compliance · reporting</div>
            <h1>Every requirement, woven to its <em>evidence.</em></h1>
            <p className="lead">GrantLoom reads your grant agreements, links every receipt and result to the obligation it satisfies, and drafts funder reports you can trace line by line — with gaps labeled, never filled in.</p>
            <div className="row" style={{ marginTop: 28 }}>
              <a href="#request" className="btn btn-gold">Request a demo</a>
              <a href="#demo" className="btn btn-ghost">See evidence mapping →</a>
            </div>
            <div className="hero-points"><span>Figures from recorded transactions</span><span>Source-referenced AI</span><span>Human approval before submission</span></div>
          </div>
          <div className="hero-card" aria-hidden>
            <div className="spread" style={{ marginBottom: 8 }}>
              <strong style={{ fontFamily: 'var(--serif)', color: 'var(--navy)' }}>Q3 Financial & Progress Report</strong>
              <span className="badge warn">Draft · awaiting approval</span>
            </div>
            <div className="line"><span>Equipment & Materials — cumulative</span><span>$73,500 <span className="cite">T-1010</span><span className="cite">T-1012</span></span></div>
            <div className="line"><span>Commissioning certificates</span><span className="unverified">5 of 6 verified</span></div>
            <div className="line"><span>Travel variance (§6.3)</span><span className="badge bad">+61% · explanation needed</span></div>
            <div className="line"><span>Households with improved access</span><span className="missing">MISSING</span></div>
            <div className="line"><span>Approver</span><span className="muted">Executive Director · pending</span></div>
          </div>
        </div>
      </section>

      <section className="section alt" id="features">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">The platform</div>
            <h2>Six AI capabilities, one rule: show your sources.</h2>
            <p>GrantLoom uses AI to read, link and draft. It never invents a number, a beneficiary count, or a funder decision.</p>
          </div>
          <div className="grid g3">
            {FEATURES.map(([t, d], i) => (
              <div className="feature" key={t}><div className="num">0{i + 1}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section navy">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Built for accountability</div>
            <h2>Trustworthy by construction</h2>
            <p>Grant reports carry your organization’s name and your funder’s trust. GrantLoom is designed so the AI can’t quietly overstate either.</p>
          </div>
          <div className="grid g4">
            {[
              ['Recorded, not generated', 'Every financial figure is a total of transactions in your register. The language model writes prose around numbers; it never produces them.'],
              ['Missing means missing', 'Absent receipts, uncertified results and unrecorded beneficiary counts appear as labeled gaps in the draft.'],
              ['Clause-level citations', 'Each extracted requirement and each report statement links back to the agreement page or record it came from.'],
              ['Humans approve', 'Only an authorized signatory can approve a report, and critical gaps must be acknowledged in writing first. Every action is audit-logged.'],
            ].map(([t, d]) => <div className="principle" key={t}><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section" id="use-cases">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Use cases</div>
            <h2>For the organizations that do the work — and those that fund it</h2>
          </div>
          <div className="tabs" role="tablist">
            {(Object.keys(USE_CASES) as (keyof typeof USE_CASES)[]).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{USE_CASES[k].title}</button>
            ))}
          </div>
          <div className="usecase">
            <div>
              <h3 style={{ fontSize: '1.5rem' }}>{uc.title}</h3>
              <p className="muted" style={{ fontSize: '1.05rem' }}>{uc.lead}</p>
              <div className="callout info"><strong>In the demo: </strong>{uc.example}</div>
            </div>
            <ul>{uc.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section alt" id="demo">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">See it work</div>
            <h2>Evidence mapping, step by step</h2>
            <p>Run the mapping on a sample of a fictional water-access grant. Click any requirement or document afterwards to trace its links.</p>
          </div>
          <EvidenceDemo />
          <p className="small muted" style={{ marginTop: 14 }}>Want the full picture? <Link to="/app">Open the live demo workspace</Link> — three fictional grants, a full expenditure register, report drafting and approvals.</p>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Pricing</div>
            <h2>Priced for mission-driven budgets</h2>
            <p>Annual billing. Nonprofit and multi-year discounts available. AWS processing included within fair-use limits.</p>
          </div>
          <div className="grid g3">
            {PLANS.map((p) => (
              <div key={p.name} className={`card price ${p.featured ? 'featured' : ''}`}>
                {p.featured && <span className="badge gold" style={{ position: 'absolute', top: -12, right: 20 }}>Most chosen</span>}
                <div><h3>{p.name}</h3><div className="muted small">{p.for}</div></div>
                <div className="amount">{p.price}<small>{p.per}</small></div>
                <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                <a href="#request" className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'center' }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="request">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 48 }}>
          <div>
            <div className="eyebrow">Request a demo</div>
            <h2>See GrantLoom with your own grant agreement</h2>
            <p className="muted">A 30-minute session with a grants specialist. Bring an agreement (or use ours) and we’ll walk through extraction, evidence mapping and a draft report.</p>
            <ul className="muted small" style={{ paddingLeft: 18 }}>
              <li>NGOs, foundations, research institutions and grant consultants</li>
              <li>Your documents are deleted after the session unless you start a trial</li>
            </ul>
          </div>
          <DemoForm />
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap spread">
          <Logo light />
          <span>© 2026 GrantLoom. All demo organizations, people and figures are fictional.</span>
        </div>
      </footer>
      <style>{`@media (max-width: 860px){ #request .wrap{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function DemoForm() {
  const { dispatch } = useStore();
  const [sent, setSent] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) errs.email = 'Please enter a valid work email.';
    if (!data.org?.trim()) errs.org = 'Please enter your organization.';
    if (!data.orgType) errs.orgType = 'Please choose an organization type.';
    if (!data.consent) errs.consent = 'Consent is required so we can contact you.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    dispatch({ type: 'demoRequest', data: { ...data, at: new Date().toISOString() } });
    setSent(data.name.split(' ')[0]);
  };

  if (sent) {
    return (
      <div className="card" style={{ alignSelf: 'start' }}>
        <h3>Thank you, {sent}.</h3>
        <p className="muted">A grants specialist will email you within one business day to schedule your demo.</p>
        <div className="callout info small">Demo environment: this request was stored locally only. In production it is posted to the GrantLoom API, which creates a HubSpot contact and a deal in the <em>Demo Requests</em> pipeline (see docs/HUBSPOT.md).</div>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <span className="small" style={{ color: 'var(--red)' }}>{errors[k]}</span>;
  return (
    <form className="card grid g2" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" className="input" autoComplete="name" />{err('name')}</div>
      <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" className="input" autoComplete="email" />{err('email')}</div>
      <div className="field"><label htmlFor="org">Organization</label><input id="org" name="org" className="input" autoComplete="organization" />{err('org')}</div>
      <div className="field"><label htmlFor="orgType">Organization type</label>
        <select id="orgType" name="orgType" className="input" defaultValue="">
          <option value="" disabled>Select…</option>
          <option>NGO / nonprofit</option><option>Foundation / funder</option><option>Research institution</option><option>Grant consultant</option><option>Other</option>
        </select>{err('orgType')}</div>
      <div className="field"><label htmlFor="grants">Active grants</label>
        <select id="grants" name="grants" className="input" defaultValue="1–5"><option>1–5</option><option>6–25</option><option>26–100</option><option>100+</option></select></div>
      <div className="field"><label htmlFor="role">Your role</label><input id="role" name="role" className="input" placeholder="e.g. Finance Director" /></div>
      <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="msg">What would you like to see?</label><textarea id="msg" name="msg" rows={3} className="input" /></div>
      <label className="small row" style={{ gridColumn: '1 / -1', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <input type="checkbox" name="consent" value="yes" style={{ marginTop: 4 }} />
        <span>I agree to be contacted by GrantLoom about this request. We never sell your data.</span>
      </label>
      {errors.consent && <div style={{ gridColumn: '1 / -1' }}>{err('consent')}</div>}
      <div style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" type="submit">Request my demo</button></div>
    </form>
  );
}
