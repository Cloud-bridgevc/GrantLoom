import type { ReactNode } from 'react';
import { describeSource, type Seg, type Severity } from '../engine/analysis';
import { useStore } from '../engine/store';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 21, color: light ? 'var(--ivory)' : 'var(--navy)' }}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? 'var(--ivory)' : 'var(--green-800)'} />
        {[8, 13, 18, 23].map((x) => <line key={x} x1={x} y1="6" x2={x} y2="26" stroke={light ? 'var(--green-800)' : 'var(--ivory)'} strokeWidth="1.6" />)}
        {[11, 16, 21].map((y, i) => <path key={y} d={`M5 ${y} H27`} stroke="var(--gold)" strokeWidth="2" strokeDasharray={i % 2 ? '4 3' : '3 4'} />)}
      </svg>
      GrantLoom
    </span>
  );
}

export function Cite({ id, grantId }: { id: string; grantId?: string }) {
  const { db } = useStore();
  return <span className="cite" title={describeSource(db, id, grantId)}>{id}</span>;
}

export function Segs({ segs, grantId }: { segs: Seg[]; grantId?: string }) {
  return (
    <>
      {segs.map((s, i) =>
        typeof s === 'string' ? <span key={i}>{s}</span>
          : 'cite' in s ? <Cite key={i} id={s.cite} grantId={grantId} />
          : 'missing' in s ? <span key={i} className="missing">⚠ {s.missing}</span>
          : <span key={i} className="unverified">{s.unverified}</span>,
      )}
    </>
  );
}

export function SevBadge({ s }: { s: Severity }) {
  return <span className={`badge ${s === 'critical' ? 'bad' : s === 'major' ? 'warn' : 'navy'}`}>{s}</span>;
}

const statusTone: Record<string, string> = {
  met: 'ok', Complete: 'ok', Submitted: 'ok', Approved: 'ok', accepted: 'ok', confirmed: 'ok',
  partial: 'warn', 'Reported complete': 'warn', 'In review': 'warn', Draft: 'warn', pending: 'warn', 'In progress': 'navy',
  missing: 'bad', violation: 'bad', rejected: 'bad', 'Not started': '',
  upcoming: 'navy',
};
export function Status({ s }: { s: string }) {
  return <span className={`badge ${statusTone[s] ?? ''}`}>{s}</span>;
}

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="spread" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>{title}</h2>
        {sub && <div className="muted">{sub}</div>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Bar({ value, marker, over }: { value: number; marker?: number; over?: boolean }) {
  return (
    <div className={`bar ${over ? 'over' : ''}`}>
      <span style={{ width: `${Math.min(100, value * 100)}%` }} />
      {marker !== undefined && <i className="marker" style={{ left: `${Math.min(100, marker * 100)}%` }} />}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div role="dialog" aria-modal style={{ position: 'fixed', inset: 0, background: 'rgba(20,33,61,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
