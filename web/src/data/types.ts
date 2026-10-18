export type Role = 'program' | 'finance' | 'approver' | 'viewer';

export interface User {
  id: string;
  name: string;
  title: string;
  role: Role;
}

export interface Funder {
  id: string;
  name: string;
  type: 'Private foundation' | 'Research trust' | 'Civic fund';
  contact: string;
  portal: string;
}

export interface BudgetLine {
  category: string;
  amount: number; // approved budget from the agreement
}

export interface Clause {
  ref: string; // e.g. "§3.1"
  page: number;
  heading: string;
  text: string;
}

export interface SourceDoc {
  id: string;
  grantId: string;
  filename: string;
  kind: 'Grant agreement' | 'Approved budget';
  uploaded: string;
  pages: number;
  clauses: Clause[];
}

export type RequirementType = 'Reporting' | 'Eligible cost' | 'Ineligible cost' | 'Procurement' | 'Evidence' | 'Variance' | 'Milestone' | 'Approval';

export interface Requirement {
  id: string;
  grantId: string;
  type: RequirementType;
  title: string;
  detail: string;
  source: { docId: string; clause: string; page: number };
  confidence: number; // model extraction confidence 0–1
  reviewed: 'accepted' | 'pending' | 'rejected';
  due?: string;
  requiresMetric?: string; // keyword an outcome metric must contain for this requirement to be satisfied
}

export interface Grant {
  id: string;
  code: string;
  title: string;
  funderId: string;
  award: number; // contractual award amount from the agreement
  currency: 'USD';
  start: string;
  end: string;
  programLead: string;
  status: 'Active' | 'Closing';
  budget: BudgetLine[];
  useCase: 'NGO' | 'Research' | 'Foundation';
}

export interface Transaction {
  id: string;
  grantId: string;
  date: string;
  vendor: string;
  description: string;
  category: string;
  amount: number;
  evidenceIds: string[]; // receipts / invoices / payroll registers
  quoteIds?: string[]; // competitive quotations
  enteredBy: string;
}

export type EvidenceKind = 'Receipt' | 'Invoice' | 'Payroll register' | 'Quotation' | 'Certificate' | 'Attendance sheet' | 'Survey report' | 'Lab report' | 'Approval letter' | 'Memo' | 'Register' | 'Log';

export interface Evidence {
  id: string;
  grantId: string;
  filename: string;
  kind: EvidenceKind;
  uploaded: string;
  uploadedBy: string;
  extraction: 'Textract' | 'Manual' | 'Pending';
  extracted?: {
    vendor?: string;
    date?: string;
    total?: number;
    lineItems?: { desc: string; amount: number }[];
    note?: string;
  };
  supports: string[]; // milestone / outcome ids this evidences
}

export interface Milestone {
  id: string;
  grantId: string;
  title: string;
  due: string;
  status: 'Complete' | 'In progress' | 'Not started' | 'Reported complete';
  completed?: string;
  requirementId?: string;
  evidenceIds: string[];
}

/** A result recorded by the project team. `value` is only what was recorded; never inferred. */
export interface Outcome {
  id: string;
  grantId: string;
  metric: string;
  target?: number; // from the agreement, if any
  entries: { label: string; value: number; evidenceIds: string[]; recordedBy: string; date: string }[];
}

export type ReportStatus = 'Not started' | 'Draft' | 'In review' | 'Approved' | 'Submitted';

export interface Report {
  id: string;
  grantId: string;
  title: string;
  period: { from: string; to: string };
  due: string;
  requirementId: string;
  status: ReportStatus;
  generatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  acknowledgedGaps: { gapId: string; note: string; by: string }[];
  funderAcknowledgement?: string; // only recorded if a real acknowledgement was received
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail?: string;
}

export interface MappingDecision {
  requirementId: string;
  itemId: string; // evidence or transaction id
  decision: 'confirmed' | 'rejected';
  by: string;
}
