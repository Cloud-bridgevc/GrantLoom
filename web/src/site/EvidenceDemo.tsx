import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Self-contained, fictional sample drawn from the "Safe Water for Lower Kesi Villages" demo grant.
const REQS = [
  { id: 'r1', clause: '§4.2', title: 'Itemized receipt for every expenditure', status: 'partial', result: '3 of 4 sampled expenditures supported — August payroll register missing.' },
  { id: 'r2', clause: '§3.5', title: 'Two quotations for purchases > USD 5,000', status: 'partial', result: 'Hand-pump purchase has 2 quotes; borehole works WP1–3 has only 1.' },
  { id: 'r3', clause: '§3.4', title: 'No alcohol or entertainment costs', status: 'violation', result: 'Catering receipt includes “Beer & wine” USD 160 — flagged as ineligible.' },
  { id: 'r4', clause: '§5.1(b)', title: '6 water points commissioned', status: 'partial', result: 'Signed certificates found for 5 of 6 water points. WP6 unverified.' },
  { id: 'r5', clause: '§6.2(c)', title: 'Report households with improved access', status: 'missing', result: 'No household figure recorded. GrantLoom will not estimate it.' },
] as const;

const EVS = [
  { id: 'e1', title: 'kesi_hardware_inv_8812.pdf', sub: 'Invoice · USD 18,600' },
  { id: 'e2', title: 'quote_kesi_hardware.pdf + quote_delta_pumps.pdf', sub: '2 quotations' },
  { id: 'e3', title: 'lowland_borehole_inv_0419.pdf', sub: 'Invoice · USD 27,450 · 1 quote on file' },
  { id: 'e4', title: 'riverside_catering_0926.jpg', sub: 'Receipt · USD 640 · 3 line items' },
  { id: 'e5', title: 'commissioning_certificates_WP1-3.pdf', sub: 'Certificates · 3 geotagged' },
  { id: 'e6', title: 'commissioning_certificates_WP4-5.pdf', sub: 'Certificates · 2 geotagged' },
  { id: 'e7', title: 'Payroll — August 2026 (T-1008)', sub: 'No document uploaded', missing: true },
];

const LINKS: { r: string; e: string; tone: 'ok' | 'warn' | 'bad'; conf: number }[] = [
  { r: 'r1', e: 'e1', tone: 'ok', conf: 0.98 },
  { r: 'r1', e: 'e3', tone: 'ok', conf: 0.98 },
  { r: 'r1', e: 'e4', tone: 'ok', conf: 0.97 },
  { r: 'r1', e: 'e7', tone: 'bad', conf: 1 },
  { r: 'r2', e: 'e2', tone: 'ok', conf: 0.95 },
  { r: 'r2', e: 'e3', tone: 'warn', conf: 0.9 },
  { r: 'r3', e: 'e4', tone: 'bad', conf: 0.91 },
  { r: 'r4', e: 'e5', tone: 'ok', conf: 0.94 },
  { r: 'r4', e: 'e6', tone: 'ok', conf: 0.94 },
];

const toneColor = { ok: 'var(--green-600)', warn: 'var(--gold)', bad: 'var(--red)' };
const statusBadge: Record<string, [string, string]> = { partial: ['warn', 'Partial'], violation: ['bad', 'Violation'], missing: ['bad', 'Missing'], met: ['ok', 'Met'] };

export default function EvidenceDemo() {
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, { x1: number; x2: number; y: number }>>({});

  const measure = () => {
    if (!box.current) return;
    const b = box.current.getBoundingClientRect();
    const p: typeof pos = {};
    for (const [k, el] of Object.entries(refs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      p[k] = { x1: r.left - b.left, x2: r.right - b.left, y: r.top - b.top + r.height / 2 };
    }
    setPos(p);
  };
  useLayoutEffect(measure, []);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const run = () => {
    setShown(0); setSel(null); setRunning(true);
    LINKS.forEach((_, i) => setTimeout(() => { setShown(i + 1); if (i === LINKS.length - 1) setRunning(false); }, 250 + i * 280));
  };

  const done = shown === LINKS.length;
  const visible = LINKS.slice(0, shown);
  const active = (l: (typeof LINKS)[number]) => !sel || l.r === sel || l.e === sel;
  const related = (id: string) => !sel || id === sel || visible.some((l) => (l.r === sel && l.e === id) || (l.e === sel && l.r === id));

  return (
    <div className="ed">
      <div className="spread" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow">Interactive demonstration · fictional data</div>
          <strong style={{ color: 'var(--navy)' }}>Harrowgate Foundation · Safe Water for Lower Kesi Villages</strong>
        </div>
        <div className="row">
          {sel && <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>Clear focus</button>}
          <button className="btn btn-primary" onClick={run} disabled={running}>{running ? 'Mapping…' : done ? '↻ Run again' : '▶ Run evidence mapping'}</button>
        </div>
      </div>
      <div className="ed-cols" ref={box}>
        <div className="ed-col">
          <div className="small muted" style={{ fontWeight: 600 }}>REQUIREMENTS · extracted from agreement</div>
          {REQS.map((r) => (
            <div key={r.id} ref={(el) => { refs.current[r.id] = el; }} className={`ed-item ${sel === r.id ? 'sel' : ''} ${related(r.id) ? '' : 'dim'}`} onClick={() => done && setSel(sel === r.id ? null : r.id)}>
              <div className="spread"><span className="cite">{r.clause}</span>{done && <span className={`badge ${statusBadge[r.status][0]}`}>{statusBadge[r.status][1]}</span>}</div>
              <div className="t" style={{ marginTop: 4 }}>{r.title}</div>
            </div>
          ))}
        </div>
        <div />
        <div className="ed-col">
          <div className="small muted" style={{ fontWeight: 600 }}>EVIDENCE · receipts, quotes, certificates</div>
          {EVS.map((e) => (
            <div key={e.id} ref={(el) => { refs.current[e.id] = el; }} className={`ed-item ${sel === e.id ? 'sel' : ''} ${related(e.id) ? '' : 'dim'}`} style={'missing' in e ? { borderStyle: 'dashed', borderColor: 'var(--red)', background: 'var(--red-soft)' } : undefined} onClick={() => done && setSel(sel === e.id ? null : e.id)}>
              <div className="t" style={{ wordBreak: 'break-word' }}>{e.title}</div>
              <div className="s">{e.sub}</div>
            </div>
          ))}
        </div>
        <svg className="ed-svg">
          {visible.map((l, i) => {
            const a = pos[l.r]; const b = pos[l.e];
            if (!a || !b) return null;
            const x1 = a.x2, x2 = b.x1, mid = (x1 + x2) / 2;
            return <path key={`${l.r}-${l.e}`} className={i === shown - 1 ? 'new' : ''} d={`M${x1},${a.y} C${mid},${a.y} ${mid},${b.y} ${x2},${b.y}`} stroke={toneColor[l.tone]} strokeDasharray={l.tone === 'bad' ? '5 4' : undefined} opacity={active(l) ? 0.9 : 0.08} />;
          })}
        </svg>
      </div>
      <div className="ed-out" style={{ opacity: done ? 1 : 0.35, transition: 'opacity .4s' }}>
        {!done && <p className="muted small">Run the mapping to see how GrantLoom links each requirement to evidence, flags gaps, and drafts report language with source references.</p>}
        {done && (
          <div className="grid g2">
            <div>
              <h3>Findings</h3>
              {(sel ? REQS.filter((r) => r.id === sel || LINKS.some((l) => l.e === sel && l.r === r.id)) : REQS).map((r) => (
                <p key={r.id} className="small" style={{ marginBottom: 8 }}><span className="cite">{r.clause}</span> {r.result}</p>
              ))}
            </div>
            <div>
              <h3>Draft report excerpt</h3>
              <p className="small" style={{ background: 'var(--ivory)', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                Five water points have signed commissioning certificates with geotagged photographs <span className="cite">EV-2027</span><span className="cite">EV-2028</span>.{' '}
                <span className="unverified">UNVERIFIED: WP6 recorded as complete without a certificate.</span>{' '}
                Households with improved water access: <span className="missing">⚠ MISSING — required by §6.2(c); no figure recorded.</span>
              </p>
              <p className="small muted">Draft only. Requires approval by the authorized signatory before submission.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
