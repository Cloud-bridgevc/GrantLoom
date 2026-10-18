import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import * as demo from '../data/demo';
import type { AuditEntry, Evidence, MappingDecision, Report, Requirement } from '../data/types';

export interface DB {
  grants: typeof demo.grants;
  funders: typeof demo.funders;
  documents: typeof demo.documents;
  requirements: Requirement[];
  transactions: typeof demo.transactions;
  evidence: Evidence[];
  milestones: typeof demo.milestones;
  outcomes: typeof demo.outcomes;
  reports: Report[];
  audit: AuditEntry[];
  mapping: MappingDecision[];
  varianceNotes: typeof demo.varianceNotes;
  users: typeof demo.users;
  currentUserId: string;
  demoRequests: Record<string, string>[];
}

const initial = (): DB => ({
  grants: demo.grants,
  funders: demo.funders,
  documents: demo.documents,
  requirements: demo.requirements,
  transactions: demo.transactions,
  evidence: demo.evidence,
  milestones: demo.milestones,
  outcomes: demo.outcomes,
  reports: demo.reports,
  audit: demo.auditSeed,
  mapping: [],
  varianceNotes: demo.varianceNotes,
  users: demo.users,
  currentUserId: 'U1',
  demoRequests: [],
});

export type Action =
  | { type: 'setUser'; userId: string }
  | { type: 'addEvidence'; evidence: Evidence; linkTxnId?: string; linkMilestoneId?: string; linkOutcome?: { id: string; label: string } }
  | { type: 'reviewRequirement'; id: string; decision: Requirement['reviewed'] }
  | { type: 'mapping'; decision: Omit<MappingDecision, 'by'> }
  | { type: 'varianceNote'; key: string; note: string }
  | { type: 'generateReport'; id: string; summary: string }
  | { type: 'sendForReview'; id: string }
  | { type: 'acknowledgeGap'; id: string; gapId: string; note: string }
  | { type: 'returnToDraft'; id: string; reason: string }
  | { type: 'approveReport'; id: string }
  | { type: 'recordSubmission'; id: string; channel: string }
  | { type: 'demoRequest'; data: Record<string, string> }
  | { type: 'reset' };

const KEY = 'grantloom-demo-v2';
const now = () => new Date().toISOString();
let seq = 0;
const auditId = () => `A-${Date.now().toString(36)}-${seq++}`;

function reducer(db: DB, a: Action): DB {
  const actor = db.users.find((u) => u.id === db.currentUserId)!;
  const log = (action: string, target: string, detail?: string): AuditEntry[] =>
    [{ id: auditId(), at: now(), actor: actor.name, action, target, detail }, ...db.audit];
  const patchReport = (id: string, p: Partial<Report>) => db.reports.map((r) => (r.id === id ? { ...r, ...p } : r));

  switch (a.type) {
    case 'setUser':
      return { ...db, currentUserId: a.userId };
    case 'addEvidence': {
      let transactions = db.transactions;
      let milestones = db.milestones;
      if (a.linkTxnId) transactions = transactions.map((t) => (t.id === a.linkTxnId ? { ...t, evidenceIds: [...t.evidenceIds, a.evidence.id] } : t));
      const outcomes = a.linkOutcome
        ? db.outcomes.map((o) => (o.id === a.linkOutcome!.id ? { ...o, entries: o.entries.map((e) => (e.label === a.linkOutcome!.label ? { ...e, evidenceIds: [...e.evidenceIds, a.evidence.id] } : e)) } : o))
        : db.outcomes;
      if (a.linkMilestoneId) milestones = milestones.map((m) => (m.id === a.linkMilestoneId ? { ...m, evidenceIds: [...m.evidenceIds, a.evidence.id] } : m));
      return {
        ...db, transactions, milestones, outcomes,
        evidence: [a.evidence, ...db.evidence],
        audit: log('Uploaded evidence', a.evidence.id, `${a.evidence.filename}${a.linkTxnId ? ` → linked to ${a.linkTxnId}` : ''}${a.linkMilestoneId ? ` → linked to ${a.linkMilestoneId}` : ''}${a.linkOutcome ? ` → evidences ${a.linkOutcome.id} (${a.linkOutcome.label})` : ''}; Textract extraction completed`),
      };
    }
    case 'reviewRequirement':
      return {
        ...db,
        requirements: db.requirements.map((r) => (r.id === a.id ? { ...r, reviewed: a.decision } : r)),
        audit: log(`Marked requirement ${a.decision}`, a.id),
      };
    case 'mapping':
      return {
        ...db,
        mapping: [...db.mapping.filter((m) => !(m.requirementId === a.decision.requirementId && m.itemId === a.decision.itemId)), { ...a.decision, by: actor.name }],
        audit: log(`${a.decision.decision === 'confirmed' ? 'Confirmed' : 'Rejected'} evidence link`, a.decision.requirementId, `${a.decision.itemId} ↔ ${a.decision.requirementId}`),
      };
    case 'varianceNote':
      return {
        ...db,
        varianceNotes: { ...db.varianceNotes, [a.key]: { note: a.note, by: actor.name, at: now() } },
        audit: log('Recorded variance explanation', a.key, a.note),
      };
    case 'generateReport':
      return { ...db, reports: patchReport(a.id, { status: 'Draft', generatedAt: now(), approvedAt: undefined, approvedBy: undefined }), audit: log('Generated report draft', a.id, a.summary) };
    case 'sendForReview':
      return { ...db, reports: patchReport(a.id, { status: 'In review' }), audit: log('Sent report for approval', a.id) };
    case 'acknowledgeGap': {
      const r = db.reports.find((x) => x.id === a.id)!;
      return {
        ...db,
        reports: patchReport(a.id, { acknowledgedGaps: [...r.acknowledgedGaps.filter((g) => g.gapId !== a.gapId), { gapId: a.gapId, note: a.note, by: actor.name }] }),
        audit: log('Acknowledged gap in report', a.id, `${a.gapId}: ${a.note}`),
      };
    }
    case 'returnToDraft':
      return { ...db, reports: patchReport(a.id, { status: 'Draft' }), audit: log('Returned report to draft', a.id, a.reason) };
    case 'approveReport':
      if (actor.role !== 'approver') return db; // enforced again here, not only in the UI
      return { ...db, reports: patchReport(a.id, { status: 'Approved', approvedBy: actor.name, approvedAt: now() }), audit: log('Approved report', a.id, 'Authorized signatory attestation recorded') };
    case 'recordSubmission': {
      const r = db.reports.find((x) => x.id === a.id)!;
      if (r.status !== 'Approved' || actor.role === 'viewer') return db;
      return { ...db, reports: patchReport(a.id, { status: 'Submitted', submittedAt: now() }), audit: log('Recorded submission', a.id, `${a.channel}. No funder acknowledgement recorded.`) };
    }
    case 'demoRequest':
      return { ...db, demoRequests: [...db.demoRequests, a.data] };
    case 'reset':
      return initial();
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return initial();
}

const Ctx = createContext<{ db: DB; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
  }, [db]);
  return <Ctx.Provider value={{ db, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  const user = c.db.users.find((u) => u.id === c.db.currentUserId)!;
  return { ...c, user };
}
