// GrantLoom analysis engine (demo mode).
// In production the same contracts are served by the API (see /server): extraction and drafting prose come from
// Amazon Bedrock, but every figure is computed here-style from PostgreSQL records — never by the model.
import { TODAY } from '../data/demo';
import type { Evidence, Grant, Requirement, Transaction } from '../data/types';
import type { DB } from './store';
import { fmtDate, pct, usd } from './format';

// ---------------------------------------------------------------- spending & variance

export const grantTxns = (db: DB, grantId: string, to = TODAY, from = '0000-01-01') =>
  db.transactions.filter((t) => t.grantId === grantId && t.date >= from && t.date <= to);

export const sum = (ts: { amount: number }[]) => ts.reduce((s, t) => s + t.amount, 0);

// Payroll and internal allocations are not purchases, so procurement (quotation) rules do not apply.
export const isPayroll = (t: Transaction) => t.vendor.startsWith('Riverbend');

export function elapsedFraction(g: Grant, asOf: string) {
  const s = new Date(g.start).getTime();
  const e = new Date(g.end).getTime();
  const n = new Date(asOf).getTime();
  return Math.min(1, Math.max(0, (n - s) / (e - s)));
}

export interface VarianceLine {
  category: string;
  budget: number;
  actual: number;
  expected: number;
  variancePct: number; // vs pro-rata
  usedPct: number; // vs full budget
  material: boolean;
  overBudget: boolean;
  reallocationRisk: boolean; // > 15% over line (prior approval clause)
  drivers: Transaction[];
  firstSpend?: string;
  explanation: string[]; // only facts drawn from records
  recordedNote?: { note: string; by: string; at: string };
  noteKey: string;
}

export function variance(db: DB, grantId: string, asOf = TODAY, threshold = 0.1): VarianceLine[] {
  const g = db.grants.find((x) => x.id === grantId)!;
  const frac = elapsedFraction(g, asOf);
  const ts = grantTxns(db, grantId, asOf);
  return g.budget.map((b) => {
    const lineTs = ts.filter((t) => t.category === b.category).sort((x, y) => y.amount - x.amount);
    const actual = sum(lineTs);
    const expected = b.amount * frac;
    const variancePct = expected ? (actual - expected) / expected : 0;
    const material = Math.abs(variancePct) > threshold;
    const overBudget = actual > b.amount;
    const reallocationRisk = actual > b.amount * 1.15;
    const firstSpend = [...lineTs].sort((x, y) => x.date.localeCompare(y.date))[0]?.date;
    const explanation: string[] = [];
    explanation.push(`Recorded spend ${usd(actual)} against a pro-rata budget of ${usd(expected)} (${pct(frac)} of the grant period elapsed at ${fmtDate(asOf)}).`);
    if (lineTs.length === 0) explanation.push('No transactions have been recorded on this line.');
    else {
      if (variancePct > 0) explanation.push(`Largest entries: ${lineTs.slice(0, 3).map((t) => `${t.id} ${t.description} (${usd(t.amount)})`).join('; ')}.`);
      if (variancePct < 0 && firstSpend) explanation.push(`First spend on this line was recorded on ${fmtDate(firstSpend)}; ${lineTs.length} transaction(s) to date.`);
      const unsupported = lineTs.filter((t) => t.evidenceIds.length === 0);
      if (unsupported.length) explanation.push(`${usd(sum(unsupported))} of this spend has no supporting document (${unsupported.map((t) => t.id).join(', ')}).`);
    }
    if (overBudget) explanation.push(`Line has exceeded its full approved budget of ${usd(b.amount)} by ${usd(actual - b.amount)}.`);
    const noteKey = `${grantId}:${b.category}`;
    return { category: b.category, budget: b.amount, actual, expected, variancePct, usedPct: actual / b.amount, material, overBudget, reallocationRisk, drivers: lineTs, firstSpend, explanation, recordedNote: db.varianceNotes[noteKey], noteKey };
  });
}

// ---------------------------------------------------------------- gap detection

export type Severity = 'critical' | 'major' | 'minor';
export interface Gap {
  id: string;
  grantId: string;
  severity: Severity;
  kind: 'Missing receipt' | 'Amount mismatch' | 'Ineligible cost' | 'Procurement' | 'Overdue milestone' | 'Milestone evidence' | 'Unverified result' | 'Overdue report' | 'Missing information' | 'Variance explanation' | 'Prior approval' | 'Incomplete evidence' | 'Unreviewed requirement';
  title: string;
  detail: string;
  refs: string[];
  requirementId?: string;
  fix: string;
}

const reqOf = (db: DB, grantId: string, type: Requirement['type']) => db.requirements.find((r) => r.grantId === grantId && r.type === type && r.reviewed !== 'rejected');
const ALCOHOL = /\b(beer|wine|alcohol|spirits|liquor)\b/i;

export function detectGaps(db: DB, grantId?: string, asOf = TODAY): Gap[] {
  const gaps: Gap[] = [];
  const grants = db.grants.filter((g) => !grantId || g.id === grantId);
  for (const g of grants) {
    const evReq = reqOf(db, g.id, 'Evidence');
    const procReq = reqOf(db, g.id, 'Procurement');
    const inelReq = reqOf(db, g.id, 'Ineligible cost');
    const budgetCats = new Set(g.budget.map((b) => b.category));

    for (const t of grantTxns(db, g.id, asOf)) {
      if (t.evidenceIds.length === 0) {
        gaps.push({ id: `GAP-RCPT-${t.id}`, grantId: g.id, severity: t.amount >= 5000 ? 'critical' : 'major', kind: 'Missing receipt', title: `No supporting document for ${t.id}`, detail: `${t.description} — ${usd(t.amount)} on ${fmtDate(t.date)} (${t.vendor}).`, refs: [t.id], requirementId: evReq?.id, fix: 'Upload the receipt, invoice or payroll register.' });
      }
      for (const eid of t.evidenceIds) {
        const e = db.evidence.find((x) => x.id === eid);
        if (e?.extracted?.total !== undefined && Math.abs(e.extracted.total - t.amount) > 0.5) {
          gaps.push({ id: `GAP-AMT-${t.id}`, grantId: g.id, severity: 'major', kind: 'Amount mismatch', title: `${t.id} amount differs from ${e.id}`, detail: `Recorded ${usd(t.amount)}; document total extracted as ${usd(e.extracted.total)}.`, refs: [t.id, e.id], requirementId: evReq?.id, fix: 'Correct the ledger entry or upload the matching document.' });
        }
        const bad = e?.extracted?.lineItems?.filter((li) => ALCOHOL.test(li.desc)) ?? [];
        if (bad.length) {
          gaps.push({ id: `GAP-INEL-${t.id}`, grantId: g.id, severity: 'critical', kind: 'Ineligible cost', title: `Prohibited item charged in ${t.id}`, detail: `${bad.map((b) => `“${b.desc}” ${usd(b.amount)}`).join(', ')} found on ${e!.id}.`, refs: [t.id, e!.id], requirementId: inelReq?.id, fix: `Remove ${usd(sum(bad))} from grant charges and reallocate to unrestricted funds.` });
        }
      }
      if (!budgetCats.has(t.category)) {
        gaps.push({ id: `GAP-CAT-${t.id}`, grantId: g.id, severity: 'critical', kind: 'Ineligible cost', title: `${t.id} uses a category outside the approved budget`, detail: t.category, refs: [t.id], fix: 'Recode the transaction to an approved budget line.' });
      }
      if (procReq && !isPayroll(t) && t.amount > 5000 && (t.quoteIds?.length ?? 0) < 2) {
        gaps.push({ id: `GAP-PROC-${t.id}`, grantId: g.id, severity: 'major', kind: 'Procurement', title: `${t.id} has ${t.quoteIds?.length ?? 0} of 2 required quotations`, detail: `${t.description} — ${usd(t.amount)}.`, refs: [t.id, ...(t.quoteIds ?? [])], requirementId: procReq.id, fix: 'Upload the second written quotation, or document a sole-source justification.' });
      }
    }

    for (const m of db.milestones.filter((x) => x.grantId === g.id)) {
      if (m.due < asOf && (m.status === 'In progress' || m.status === 'Not started')) {
        gaps.push({ id: `GAP-MS-${m.id}`, grantId: g.id, severity: 'critical', kind: 'Overdue milestone', title: `${m.title} is overdue`, detail: `Due ${fmtDate(m.due)}; status ${m.status}.`, refs: [m.id], requirementId: m.requirementId, fix: 'Update status or notify the funder of the delay.' });
      }
      if (m.status === 'Reported complete' && m.evidenceIds.length === 0) {
        gaps.push({ id: `GAP-MSEV-${m.id}`, grantId: g.id, severity: 'major', kind: 'Milestone evidence', title: `${m.title} is reported complete with no evidence`, detail: 'Completion cannot be verified from uploaded records.', refs: [m.id], requirementId: m.requirementId, fix: 'Upload completion evidence.' });
      }
    }

    for (const o of db.outcomes.filter((x) => x.grantId === g.id)) {
      for (const en of o.entries.filter((e) => e.evidenceIds.length === 0)) {
        gaps.push({ id: `GAP-OUT-${o.id}-${en.label}`, grantId: g.id, severity: 'major', kind: 'Unverified result', title: `${o.metric}: “${en.label}” (${en.value}) has no evidence`, detail: `Entered by ${en.recordedBy} on ${fmtDate(en.date)}. It will be labeled unverified and excluded from verified totals.`, refs: [o.id], fix: 'Upload the supporting certificate, register or attendance sheet.' });
      }
    }

    for (const e of db.evidence.filter((x) => x.grantId === g.id && /unsigned/i.test(x.extracted?.note ?? ''))) {
      gaps.push({ id: `GAP-INC-${e.id}`, grantId: g.id, severity: 'major', kind: 'Incomplete evidence', title: `${e.filename} is incomplete`, detail: e.extracted!.note!, refs: [e.id], requirementId: reqOf(db, g.id, 'Evidence')?.id, fix: 'Obtain the missing signatures or exclude those lines.' });
    }

    for (const r of db.requirements.filter((x) => x.grantId === g.id)) {
      if (r.type === 'Reporting' && r.due && r.due < asOf) {
        const rep = db.reports.find((x) => x.requirementId === r.id);
        if (!rep || rep.status !== 'Submitted') {
          gaps.push({ id: `GAP-REP-${r.id}`, grantId: g.id, severity: 'critical', kind: 'Overdue report', title: `${r.title} is overdue`, detail: `Due ${fmtDate(r.due)} (${r.source.clause}); report status: ${rep?.status ?? 'none'}.`, refs: [r.id, ...(rep ? [rep.id] : [])], requirementId: r.id, fix: 'Draft, approve and submit the report, and contact the funder.' });
        }
      }
      if (r.requiresMetric && !db.outcomes.some((o) => o.grantId === g.id && o.metric.toLowerCase().includes(r.requiresMetric!))) {
        gaps.push({ id: `GAP-INFO-${r.id}`, grantId: g.id, severity: 'major', kind: 'Missing information', title: `No recorded data for: ${r.title}`, detail: `${r.source.clause} requires it, but no matching result has been recorded. GrantLoom will not estimate it.`, refs: [r.id], requirementId: r.id, fix: 'Record the figure with its evidence (e.g. household register).' });
      }
      if (r.reviewed === 'pending') {
        gaps.push({ id: `GAP-REV-${r.id}`, grantId: g.id, severity: 'minor', kind: 'Unreviewed requirement', title: `AI-extracted requirement awaiting review: ${r.title}`, detail: `Confidence ${pct(r.confidence)} from ${r.source.clause}.`, refs: [r.id], requirementId: r.id, fix: 'Accept or reject the extraction.' });
      }
    }

    const varReq = reqOf(db, g.id, 'Variance');
    const apprReq = db.requirements.find((r) => r.grantId === g.id && r.type === 'Approval' && /realloc/i.test(r.title));
    if (varReq) {
      for (const v of variance(db, g.id, asOf)) {
        if (v.material && !v.recordedNote) {
          gaps.push({ id: `GAP-VAR-${g.id}-${v.category}`, grantId: g.id, severity: 'major', kind: 'Variance explanation', title: `${v.category} varies ${v.variancePct > 0 ? '+' : ''}${pct(v.variancePct)} from pro-rata`, detail: 'A written explanation is required and none has been recorded.', refs: [varReq.id], requirementId: varReq.id, fix: 'Finance lead records the explanation.' });
        }
        if (apprReq && v.reallocationRisk) {
          gaps.push({ id: `GAP-APPR-${g.id}-${v.category}`, grantId: g.id, severity: 'critical', kind: 'Prior approval', title: `${v.category} is ${pct(v.usedPct - 1)} over its line budget`, detail: `No funder approval for reallocation is recorded (${apprReq.source.clause}).`, refs: [apprReq.id], requirementId: apprReq.id, fix: 'Request written reallocation approval from the funder, then upload it.' });
        }
      }
    }
  }
  const order: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------------------------------------------------------------- evidence mapping

export interface Link { id: string; kind: 'evidence' | 'transaction' | 'milestone' | 'report' | 'note'; label: string; confidence: number; reason: string; decision?: 'confirmed' | 'rejected' }
export interface MappingRow { requirement: Requirement; status: 'met' | 'partial' | 'missing' | 'upcoming' | 'violation'; links: Link[]; summary: string }

const evLabel = (e: Evidence) => `${e.id} · ${e.filename}`;

export function mapEvidence(db: DB, grantId: string, asOf = TODAY): MappingRow[] {
  const ts = grantTxns(db, grantId, asOf);
  const evById = (id: string) => db.evidence.find((e) => e.id === id);
  const decide = (reqId: string, links: Link[]) =>
    links.map((l) => ({ ...l, decision: db.mapping.find((m) => m.requirementId === reqId && m.itemId === l.id)?.decision }));

  return db.requirements.filter((r) => r.grantId === grantId && r.reviewed !== 'rejected').map((r): MappingRow => {
    let links: Link[] = [];
    let status: MappingRow['status'] = 'missing';
    let summary = '';
    switch (r.type) {
      case 'Evidence': {
        const supported = ts.filter((t) => t.evidenceIds.length > 0);
        links = supported.flatMap((t) => t.evidenceIds.map((id) => {
          const e = evById(id)!;
          const match = e.extracted?.total === t.amount;
          return { id, kind: 'evidence' as const, label: `${evLabel(e)} → ${t.id}`, confidence: match ? 0.98 : 0.62, reason: match ? `Amount, vendor and date match ${t.id}` : `Linked to ${t.id} but totals differ` };
        }));
        const missing = ts.length - supported.length;
        status = missing === 0 ? 'met' : 'partial';
        summary = `${supported.length} of ${ts.length} expenditures supported${missing ? `; ${missing} missing` : ''}.`;
        break;
      }
      case 'Procurement': {
        const big = ts.filter((t) => !isPayroll(t) && t.amount > 5000);
        links = big.flatMap((t) => (t.quoteIds ?? []).map((q) => ({ id: q, kind: 'evidence' as const, label: `${evLabel(evById(q)!)} → ${t.id}`, confidence: 0.95, reason: `Quotation for ${t.description}` })));
        const short = big.filter((t) => (t.quoteIds?.length ?? 0) < 2);
        status = short.length ? 'partial' : 'met';
        summary = `${big.length - short.length} of ${big.length} purchases > USD 5,000 have two quotations.`;
        break;
      }
      case 'Ineligible cost': {
        const hits = ts.flatMap((t) => t.evidenceIds.map(evById).filter((e) => e?.extracted?.lineItems?.some((li) => ALCOHOL.test(li.desc))).map((e) => ({ t, e: e! })));
        links = hits.map(({ t, e }) => ({ id: e.id, kind: 'evidence', label: `${evLabel(e)} → ${t.id}`, confidence: 0.91, reason: 'Line item matches a prohibited cost type' }));
        status = hits.length ? 'violation' : 'met';
        summary = hits.length ? `${hits.length} expenditure(s) include prohibited items.` : `All ${ts.length} expenditures screened; none prohibited.`;
        break;
      }
      case 'Eligible cost': {
        const g = db.grants.find((x) => x.id === grantId)!;
        const cats = g.budget.map((b) => b.category);
        const off = ts.filter((t) => !cats.includes(t.category));
        links = cats.map((c) => ({ id: c, kind: 'note', label: `${c}: ${ts.filter((t) => t.category === c).length} transactions`, confidence: 1, reason: 'Coded to approved budget line' }));
        status = off.length ? 'violation' : 'met';
        summary = off.length ? `${off.length} transactions outside approved categories.` : `All ${ts.length} transactions coded to approved categories.`;
        break;
      }
      case 'Milestone': {
        const m = db.milestones.find((x) => x.requirementId === r.id);
        const o = db.outcomes.find((x) => x.grantId === grantId && m && x.entries.some((en) => en.evidenceIds.some((id) => m.evidenceIds.includes(id))));
        links = (m?.evidenceIds ?? []).map((id) => ({ id, kind: 'evidence', label: evLabel(evById(id)!), confidence: 0.93, reason: evById(id)?.extracted?.note ?? 'Milestone evidence' }));
        if (m) links.unshift({ id: m.id, kind: 'milestone', label: `${m.id} · ${m.status}`, confidence: 1, reason: m.title });
        const verified = o ? sum(o.entries.filter((e) => e.evidenceIds.length).map((e) => ({ amount: e.value }))) : undefined;
        if (!m) { status = 'missing'; summary = 'No milestone record linked.'; }
        else if (m.status === 'Complete' && m.evidenceIds.length) { status = 'met'; summary = `Complete ${m.completed ? fmtDate(m.completed) : ''}, evidenced.`; }
        else if (m.due > asOf && m.status !== 'Reported complete') { status = 'upcoming'; summary = `Due ${fmtDate(m.due)} — ${m.status.toLowerCase()}${verified !== undefined && o?.target ? `; ${verified} of ${o.target} verified so far` : ''}.`; }
        else if (m.evidenceIds.length) { status = 'partial'; summary = `${m.status}; evidence supports ${verified ?? '?'}${o?.target ? ` of ${o.target}` : ''}.`; }
        else { status = 'missing'; summary = `${m.status}, no evidence uploaded.`; }
        break;
      }
      case 'Reporting': {
        const rep = db.reports.find((x) => x.requirementId === r.id);
        if (r.requiresMetric) {
          const o = db.outcomes.find((x) => x.grantId === grantId && x.metric.toLowerCase().includes(r.requiresMetric!));
          status = o ? 'met' : 'missing';
          summary = o ? 'Recorded.' : 'No recorded figure. Will appear as MISSING in reports.';
          break;
        }
        if (rep) links = [{ id: rep.id, kind: 'report', label: `${rep.id} · ${rep.status}`, confidence: 1, reason: rep.title }];
        if (rep?.status === 'Submitted') { status = 'met'; summary = `Submitted ${fmtDate(rep.submittedAt!.slice(0, 10))}. Funder acknowledgement: ${rep.funderAcknowledgement ?? 'not recorded'}.`; }
        else if (r.due && r.due < asOf) { status = 'missing'; summary = `Overdue since ${fmtDate(r.due)}.`; }
        else if (rep) { status = 'partial'; summary = `${rep.status}; due ${r.due ? fmtDate(r.due) : '—'}.`; }
        else { status = 'upcoming'; summary = r.due ? `Due ${fmtDate(r.due)}.` : 'Ongoing obligation.'; }
        break;
      }
      case 'Variance': {
        const vs = variance(db, grantId, asOf).filter((v) => v.material);
        links = vs.map((v) => ({ id: v.noteKey, kind: 'note', label: `${v.category} ${v.variancePct > 0 ? '+' : ''}${pct(v.variancePct)}`, confidence: 1, reason: v.recordedNote ? 'Explanation recorded' : 'No explanation recorded' }));
        const unexplained = vs.filter((v) => !v.recordedNote).length;
        status = unexplained ? 'partial' : 'met';
        summary = `${vs.length} material variance(s); ${unexplained} unexplained.`;
        break;
      }
      case 'Approval': {
        if (/realloc/i.test(r.title)) {
          const risk = variance(db, grantId, asOf).filter((v) => v.reallocationRisk);
          status = risk.length ? 'violation' : 'met';
          summary = risk.length ? `${risk.map((v) => v.category).join(', ')} > 15% over line; no funder approval on file.` : 'No line exceeds the reallocation threshold.';
        } else if (/ethics/i.test(r.title)) {
          const m = db.milestones.find((x) => x.requirementId === r.id);
          links = (m?.evidenceIds ?? []).map((id) => ({ id, kind: 'evidence', label: evLabel(evById(id)!), confidence: 0.96, reason: evById(id)?.extracted?.note ?? '' }));
          status = links.length ? 'met' : 'missing';
          summary = links.length ? 'Approval letter on file.' : 'No approval letter uploaded.';
        } else {
          const reps = db.reports.filter((x) => x.grantId === grantId);
          links = reps.filter((x) => x.approvedBy).map((x) => ({ id: x.id, kind: 'report', label: `${x.id} approved by ${x.approvedBy}`, confidence: 1, reason: 'Recorded approval' }));
          status = 'met';
          summary = 'Enforced: reports cannot be marked submitted without approver sign-off.';
        }
        break;
      }
    }
    return { requirement: r, status, links: decide(r.id, links), summary };
  });
}

// ---------------------------------------------------------------- report drafting

export type Seg = string | { cite: string } | { missing: string } | { unverified: string };
export interface DraftSection { heading: string; paras: Seg[][]; table?: { head: string[]; rows: (string | Seg[])[][] } }
export interface Draft { sections: DraftSection[]; gaps: Gap[]; sourcesUsed: string[] }

export function draftReport(db: DB, reportId: string): Draft {
  const rep = db.reports.find((r) => r.id === reportId)!;
  const g = db.grants.find((x) => x.id === rep.grantId)!;
  const f = db.funders.find((x) => x.id === g.funderId)!;
  const to = rep.period.to;
  const periodTs = grantTxns(db, g.id, to, rep.period.from);
  const cumTs = grantTxns(db, g.id, to);
  const used = new Set<string>();
  const c = (id: string): Seg => { used.add(id); return { cite: id }; };
  const cites = (ids: string[]) => ids.flatMap((id) => [c(id)]);
  const req = db.requirements.find((r) => r.id === rep.requirementId);
  const sections: DraftSection[] = [];

  sections.push({
    heading: '1. Overview',
    paras: [[
      `This report covers ${g.title} (${g.code}), funded by ${f.name}, for the period ${fmtDate(rep.period.from)} to ${fmtDate(to)}. It is prepared under `, ...(req ? [c(req.source.clause)] : []),
      ` from records held in GrantLoom. All financial figures are totals of recorded transactions; results are stated only where recorded, and unverified items are labeled.`,
    ]],
  });

  const unsupported = periodTs.filter((t) => t.evidenceIds.length === 0);
  const vs = variance(db, g.id, to);
  sections.push({
    heading: '2. Financial summary',
    paras: [
      [`Expenditure recorded in the period: ${usd(sum(periodTs))} across ${periodTs.length} transactions. Cumulative expenditure to ${fmtDate(to)}: ${usd(sum(cumTs))} (${pct(sum(cumTs) / g.award)} of the ${usd(g.award)} award).`],
      ...(unsupported.length ? [[{ unverified: `${usd(sum(unsupported))} of period expenditure has no supporting document:` } as Seg, ...cites(unsupported.map((t) => t.id)), ' These entries are included in the totals because they are recorded, but are flagged unsupported until documents are uploaded.']] : []),
    ],
    table: {
      head: ['Budget line', 'Approved', 'This period', 'Cumulative', 'Remaining', 'vs pro-rata'],
      rows: vs.map((v) => {
        const p = periodTs.filter((t) => t.category === v.category);
        return [v.category, usd(v.budget), [usd(sum(p)), ...cites(p.map((t) => t.id).slice(0, 4)), ...(p.length > 4 ? [`+${p.length - 4}`] : [])], usd(v.actual), usd(v.budget - v.actual), `${v.variancePct > 0 ? '+' : ''}${pct(v.variancePct)}${v.material ? ' ▲' : ''}`];
      }),
    },
  });

  const material = vs.filter((v) => v.material);
  const varReq = db.requirements.find((r) => r.grantId === g.id && r.type === 'Variance');
  if (material.length) {
    sections.push({
      heading: '3. Budget variance explanations',
      paras: material.map((v): Seg[] => [
        `${v.category} (${v.variancePct > 0 ? '+' : ''}${pct(v.variancePct)} vs pro-rata): `,
        ...(v.recordedNote ? [v.recordedNote.note, ` (explanation recorded by ${v.recordedNote.by})`] : [{ missing: `Written explanation required${varReq ? ` under ${varReq.source.clause}` : ''} — not yet recorded by finance lead` } as Seg]),
        ...(v.reallocationRisk ? [' ', { missing: 'Line exceeds approved budget by more than 15%; no funder reallocation approval on file' } as Seg] : []),
        ...(v.drivers.length && v.variancePct > 0 ? [' Supporting entries: ', ...cites(v.drivers.slice(0, 3).map((t) => t.id))] : []),
      ]),
    });
  }

  const ms = db.milestones.filter((m) => m.grantId === g.id && m.due <= addMonths(to, 1));
  sections.push({
    heading: `${material.length ? 4 : 3}. Milestone progress`,
    paras: ms.map((m): Seg[] => {
      const base: Seg[] = [`${m.title} (due ${fmtDate(m.due)}): `];
      if (m.status === 'Complete') return [...base, `completed ${m.completed ? fmtDate(m.completed) : ''}. Evidence: `, ...cites(m.evidenceIds)];
      if (m.status === 'Reported complete') {
        const o = db.outcomes.find((x) => x.grantId === g.id && x.entries.some((e) => e.evidenceIds.some((id) => m.evidenceIds.includes(id))));
        const verified = o ? o.entries.filter((e) => e.evidenceIds.length).reduce((s, e) => s + e.value, 0) : 0;
        return [...base, 'reported complete by the project team. ', ...(m.evidenceIds.length ? ['Evidence on file: ', ...cites(m.evidenceIds), '. '] : []), ...(o?.target && verified < o.target ? [{ unverified: `Evidence supports ${verified} of ${o.target}` } as Seg, ' — remaining evidence outstanding.'] : m.evidenceIds.length ? [] : [{ missing: 'No completion evidence uploaded' } as Seg])];
      }
      return [...base, `${m.status.toLowerCase()}.`, ...(m.evidenceIds.length ? [' Evidence to date: ', ...cites(m.evidenceIds)] : [])];
    }),
  });

  const os = db.outcomes.filter((o) => o.grantId === g.id);
  const metricReqs = db.requirements.filter((r) => r.grantId === g.id && r.requiresMetric && !os.some((o) => o.metric.toLowerCase().includes(r.requiresMetric!)));
  sections.push({
    heading: `${material.length ? 5 : 4}. Results`,
    paras: [
      ...os.map((o): Seg[] => {
        const ver = o.entries.filter((e) => e.evidenceIds.length);
        const unv = o.entries.filter((e) => !e.evidenceIds.length);
        return [
          `${o.metric}: ${ver.reduce((s, e) => s + e.value, 0)} verified${o.target ? ` against a target of ${o.target}` : ''} `, ...cites(ver.flatMap((e) => e.evidenceIds)), '.',
          ...unv.flatMap((e): Seg[] => [' ', { unverified: `UNVERIFIED: a further ${e.value} recorded for ${e.label} without evidence` }]),
        ];
      }),
      ...metricReqs.map((r): Seg[] => [`${r.title}: `, { missing: `MISSING — required by ${r.source.clause}; no figure has been recorded. GrantLoom does not estimate beneficiary numbers.` }]),
    ],
  });

  const gaps = detectGaps(db, g.id, to).filter((x) => x.kind !== 'Unreviewed requirement');
  const inel = gaps.filter((x) => x.kind === 'Ineligible cost' || x.kind === 'Procurement' || x.kind === 'Amount mismatch');
  if (inel.length) {
    sections.push({
      heading: `${material.length ? 6 : 5}. Compliance exceptions`,
      paras: inel.map((x): Seg[] => [`${x.title}. ${x.detail} Proposed action: ${x.fix} `, ...cites(x.refs)]),
    });
  }
  sections.push({
    heading: 'Approval',
    paras: [[`This draft must be reviewed and approved by an authorized signatory before submission`, ...(db.requirements.find((r) => r.grantId === g.id && /signatory/i.test(r.title)) ? [' ', c('§9.1')] : []), '. GrantLoom does not submit reports to funders and does not record funder acceptance unless an acknowledgement is received and uploaded.']],
  });

  return { sections, gaps, sourcesUsed: [...used] };
}

function addMonths(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- source lookup (for citation hovers)

export function describeSource(db: DB, id: string, grantId?: string): string {
  const t = db.transactions.find((x) => x.id === id);
  if (t) return `${t.id} · ${fmtDate(t.date)} · ${t.vendor} · ${t.description} · ${usd(t.amount)} · ${t.category}`;
  const e = db.evidence.find((x) => x.id === id);
  if (e) return `${e.id} · ${e.kind} · ${e.filename}${e.extracted?.total !== undefined ? ` · extracted total ${usd(e.extracted.total)}` : ''}${e.extracted?.note ? ` · ${e.extracted.note}` : ''}`;
  const m = db.milestones.find((x) => x.id === id);
  if (m) return `${m.id} · ${m.title} · ${m.status}`;
  const r = db.requirements.find((x) => x.id === id);
  if (r) return `${r.id} · ${r.title} · ${r.source.clause}`;
  const o = db.outcomes.find((x) => x.id === id);
  if (o) return `${o.id} · ${o.metric}`;
  if (id.startsWith('§')) {
    const docs = db.documents.filter((d) => !grantId || d.grantId === grantId);
    for (const d of docs) {
      const cl = d.clauses.find((x) => id.startsWith(x.ref));
      if (cl) return `${d.filename} p.${cl.page} ${cl.ref} ${cl.heading}: “${cl.text}”`;
    }
  }
  return id;
}
