// FICTIONAL DEMONSTRATION DATA. Every organization, person, place, document and figure below is invented.
// Financial totals are never stored: they are computed from the transaction register at runtime.
import type { AuditEntry, Evidence, Funder, Grant, Milestone, Outcome, Report, Requirement, SourceDoc, Transaction, User } from './types';

export const TODAY = '2026-10-18';
export const ORG = 'Riverbend Community Health Collective';

export const users: User[] = [
  { id: 'U1', name: 'Amara Osei', title: 'Program Manager', role: 'program' },
  { id: 'U2', name: 'Daniel Reyes', title: 'Finance Lead', role: 'finance' },
  { id: 'U3', name: 'Dr. Leila Haddad', title: 'Executive Director (authorized approver)', role: 'approver' },
  { id: 'U4', name: 'Sam Kowalski', title: 'Board Observer (read-only)', role: 'viewer' },
];

export const funders: Funder[] = [
  { id: 'F1', name: 'Harrowgate Foundation', type: 'Private foundation', contact: 'Program Officer, Water & Sanitation', portal: 'Harrowgate grantee portal' },
  { id: 'F2', name: 'Northfield Science Trust', type: 'Research trust', contact: 'Research Grants Office', portal: 'Email submission' },
  { id: 'F3', name: 'Meridian Civic Fund', type: 'Civic fund', contact: 'Youth Opportunity Portfolio', portal: 'Meridian Fluxx portal' },
];

export const grants: Grant[] = [
  {
    id: 'G1', code: 'HF-2026-0147', title: 'Safe Water for Lower Kesi Villages', funderId: 'F1', award: 240000, currency: 'USD',
    start: '2026-01-01', end: '2026-12-31', programLead: 'Amara Osei', status: 'Active', useCase: 'NGO',
    budget: [
      { category: 'Personnel', amount: 96000 },
      { category: 'Equipment & Materials', amount: 84000 },
      { category: 'Community Training', amount: 24000 },
      { category: 'Travel', amount: 12000 },
      { category: 'Monitoring & Evaluation', amount: 12000 },
      { category: 'Indirect Costs', amount: 12000 },
    ],
  },
  {
    id: 'G2', code: 'NST-R-25-031', title: 'Early-Grade Literacy Longitudinal Study', funderId: 'F2', award: 180000, currency: 'USD',
    start: '2025-09-01', end: '2027-08-31', programLead: 'Amara Osei', status: 'Active', useCase: 'Research',
    budget: [
      { category: 'Research Staff', amount: 108000 },
      { category: 'Data Collection', amount: 36000 },
      { category: 'Equipment', amount: 9000 },
      { category: 'Dissemination', amount: 9000 },
      { category: 'Indirect Costs', amount: 18000 },
    ],
  },
  {
    id: 'G3', code: 'MCF-YO-2604', title: 'Youth Digital Skills Pathways', funderId: 'F3', award: 95000, currency: 'USD',
    start: '2026-04-01', end: '2027-03-31', programLead: 'Amara Osei', status: 'Active', useCase: 'Foundation',
    budget: [
      { category: 'Instructors', amount: 48000 },
      { category: 'Laptops & Connectivity', amount: 30000 },
      { category: 'Venue', amount: 8000 },
      { category: 'Learner Stipends', amount: 9000 },
    ],
  },
];

export const documents: SourceDoc[] = [
  {
    id: 'DOC-1', grantId: 'G1', filename: 'Harrowgate_Grant_Agreement_HF-2026-0147.pdf', kind: 'Grant agreement', uploaded: '2026-01-06', pages: 11,
    clauses: [
      { ref: '§2.1', page: 2, heading: 'Award', text: 'The Foundation awards the Grantee USD 240,000 for the period 1 January 2026 to 31 December 2026, to be applied solely to the Approved Budget in Schedule A.' },
      { ref: '§3.1', page: 3, heading: 'Eligible costs', text: 'Eligible costs are Personnel, Equipment & Materials, Community Training, Travel, Monitoring & Evaluation, and Indirect Costs not exceeding five percent (5%) of the total award.' },
      { ref: '§3.4', page: 4, heading: 'Ineligible costs', text: 'Grant funds shall not be used for alcoholic beverages, entertainment, fines or penalties, or political activity.' },
      { ref: '§3.5', page: 4, heading: 'Procurement', text: 'Any single purchase exceeding USD 5,000 must be supported by at least two (2) competitive written quotations retained on file.' },
      { ref: '§4.2', page: 5, heading: 'Supporting documentation', text: 'Every expenditure charged to the grant must be supported by an itemized receipt, invoice, or payroll register matching the amount recorded.' },
      { ref: '§5.1', page: 6, heading: 'Milestones', text: '(a) Baseline water survey completed by 31 March 2026; (b) six (6) community water points rehabilitated and commissioned by 30 September 2026; (c) one hundred twenty (120) water committee members trained by 31 October 2026; (d) endline survey completed by 15 December 2026.' },
      { ref: '§6.1', page: 7, heading: 'Financial reporting', text: 'The Grantee shall submit a financial report for each calendar quarter within thirty-one (31) days of the quarter end, showing expenditure against each budget line.' },
      { ref: '§6.2', page: 7, heading: 'Narrative reporting', text: 'An interim narrative report is due 31 July 2026 and a final narrative and financial report is due 28 February 2027. Narrative reports shall state (a) progress against milestones, (b) results achieved with supporting evidence, and (c) the number of households with improved water access.' },
      { ref: '§6.3', page: 8, heading: 'Budget variance', text: 'Where expenditure on any budget line varies by more than ten percent (10%) from the pro-rata budget for the reporting period, the Grantee shall provide a written explanation.' },
      { ref: '§6.4', page: 8, heading: 'Reallocation', text: 'Reallocation of more than fifteen percent (15%) of any budget line requires the prior written approval of the Foundation.' },
      { ref: '§7.1', page: 9, heading: 'Evidence of works', text: 'Each rehabilitated water point shall be evidenced by a signed commissioning certificate including a geotagged photograph.' },
      { ref: '§7.2', page: 9, heading: 'Evidence of training', text: 'Training shall be evidenced by attendance sheets signed by participants for each session.' },
      { ref: '§9.1', page: 10, heading: 'Authorized signatory', text: 'Reports must be approved and signed by the Grantee\'s authorized signatory prior to submission.' },
    ],
  },
  {
    id: 'DOC-2', grantId: 'G2', filename: 'Northfield_Research_Award_NST-R-25-031.pdf', kind: 'Grant agreement', uploaded: '2025-09-04', pages: 8,
    clauses: [
      { ref: '§2.3', page: 2, heading: 'Ethics', text: 'No human-subject data collection may commence until written approval from a recognized ethics review board is provided to the Trust.' },
      { ref: '§3.2', page: 3, heading: 'Eligible costs', text: 'Eligible costs are Research Staff, Data Collection, Equipment, Dissemination, and Indirect Costs at up to ten percent (10%) of total award.' },
      { ref: '§5.1', page: 5, heading: 'Annual progress report', text: 'An annual progress report including expenditure to date is due on 30 September of each award year.' },
      { ref: '§5.3', page: 5, heading: 'Data collection milestones', text: 'Wave 1 data collection completed by 30 June 2026; Wave 2 data collection completed by 31 March 2027.' },
      { ref: '§6.1', page: 6, heading: 'Open access', text: 'Publications arising from the award shall be made openly accessible within six months of publication.' },
    ],
  },
  {
    id: 'DOC-3', grantId: 'G3', filename: 'Meridian_Grant_Letter_MCF-YO-2604.pdf', kind: 'Grant agreement', uploaded: '2026-04-03', pages: 5,
    clauses: [
      { ref: '§2', page: 1, heading: 'Budget', text: 'Funds are approved for Instructors, Laptops & Connectivity, Venue, and Learner Stipends as set out in the attached budget.' },
      { ref: '§4.1', page: 2, heading: 'Six-month report', text: 'A six-month progress and financial report is due 15 October 2026.' },
      { ref: '§4.3', page: 3, heading: 'Stipend evidence', text: 'Learner stipends must be evidenced by a register signed by each recipient.' },
      { ref: '§5', page: 3, heading: 'Cohort milestones', text: 'Cohort 1 enrolled by 15 May 2026 and completing the curriculum by 30 September 2026.' },
    ],
  },
];

// AI-extracted requirements (Textract text → Bedrock structured extraction), each tied to a clause.
export const requirements: Requirement[] = [
  { id: 'R-A1', grantId: 'G1', type: 'Reporting', title: 'Quarterly financial report', detail: 'Financial report per calendar quarter within 31 days of quarter end, by budget line. Q3 2026 report due 31 Oct 2026.', source: { docId: 'DOC-1', clause: '§6.1', page: 7 }, confidence: 0.97, reviewed: 'accepted', due: '2026-10-31' },
  { id: 'R-A2', grantId: 'G1', type: 'Reporting', title: 'Interim narrative report', detail: 'Interim narrative report due 31 Jul 2026.', source: { docId: 'DOC-1', clause: '§6.2', page: 7 }, confidence: 0.95, reviewed: 'accepted', due: '2026-07-31' },
  { id: 'R-A3', grantId: 'G1', type: 'Reporting', title: 'Final narrative & financial report', detail: 'Final report due 28 Feb 2027.', source: { docId: 'DOC-1', clause: '§6.2', page: 7 }, confidence: 0.95, reviewed: 'accepted', due: '2027-02-28' },
  { id: 'R-A4', grantId: 'G1', type: 'Eligible cost', title: 'Eligible cost categories', detail: 'Personnel; Equipment & Materials; Community Training; Travel; Monitoring & Evaluation; Indirect ≤ 5% of award.', source: { docId: 'DOC-1', clause: '§3.1', page: 3 }, confidence: 0.96, reviewed: 'accepted' },
  { id: 'R-A5', grantId: 'G1', type: 'Ineligible cost', title: 'Prohibited costs', detail: 'No alcohol, entertainment, fines/penalties, or political activity.', source: { docId: 'DOC-1', clause: '§3.4', page: 4 }, confidence: 0.98, reviewed: 'accepted' },
  { id: 'R-A6', grantId: 'G1', type: 'Procurement', title: 'Two quotations above USD 5,000', detail: 'Single purchases > USD 5,000 need ≥ 2 written quotations on file.', source: { docId: 'DOC-1', clause: '§3.5', page: 4 }, confidence: 0.94, reviewed: 'accepted' },
  { id: 'R-A7', grantId: 'G1', type: 'Evidence', title: 'Itemized support for every expenditure', detail: 'Receipt, invoice or payroll register matching the recorded amount.', source: { docId: 'DOC-1', clause: '§4.2', page: 5 }, confidence: 0.97, reviewed: 'accepted' },
  { id: 'R-A8', grantId: 'G1', type: 'Variance', title: 'Explain variance > 10%', detail: 'Written explanation for any budget line varying > 10% from pro-rata budget.', source: { docId: 'DOC-1', clause: '§6.3', page: 8 }, confidence: 0.93, reviewed: 'accepted' },
  { id: 'R-A9', grantId: 'G1', type: 'Approval', title: 'Prior approval for reallocation > 15%', detail: 'Funder written approval before reallocating > 15% of any line.', source: { docId: 'DOC-1', clause: '§6.4', page: 8 }, confidence: 0.92, reviewed: 'accepted' },
  { id: 'R-A10', grantId: 'G1', type: 'Milestone', title: 'Six water points commissioned', detail: '6 water points rehabilitated and commissioned by 30 Sep 2026, each with signed certificate + geotagged photo (§7.1).', source: { docId: 'DOC-1', clause: '§5.1(b)', page: 6 }, confidence: 0.95, reviewed: 'accepted', due: '2026-09-30' },
  { id: 'R-A11', grantId: 'G1', type: 'Milestone', title: '120 committee members trained', detail: '120 water committee members trained by 31 Oct 2026, evidenced by signed attendance sheets (§7.2).', source: { docId: 'DOC-1', clause: '§5.1(c)', page: 6 }, confidence: 0.94, reviewed: 'accepted', due: '2026-10-31' },
  { id: 'R-A12', grantId: 'G1', type: 'Reporting', title: 'Report household water access', detail: 'Narrative reports must state the number of households with improved water access.', source: { docId: 'DOC-1', clause: '§6.2(c)', page: 7 }, confidence: 0.88, reviewed: 'pending', requiresMetric: 'household' },
  { id: 'R-A13', grantId: 'G1', type: 'Approval', title: 'Authorized signatory approval', detail: 'Reports approved and signed by the authorized signatory before submission.', source: { docId: 'DOC-1', clause: '§9.1', page: 10 }, confidence: 0.96, reviewed: 'accepted' },
  { id: 'R-A14', grantId: 'G1', type: 'Milestone', title: 'Baseline water survey', detail: 'Baseline survey completed by 31 Mar 2026.', source: { docId: 'DOC-1', clause: '§5.1(a)', page: 6 }, confidence: 0.96, reviewed: 'accepted', due: '2026-03-31' },

  { id: 'R-B1', grantId: 'G2', type: 'Approval', title: 'Ethics approval before data collection', detail: 'Ethics board approval provided to the Trust before human-subject data collection.', source: { docId: 'DOC-2', clause: '§2.3', page: 2 }, confidence: 0.97, reviewed: 'accepted' },
  { id: 'R-B2', grantId: 'G2', type: 'Eligible cost', title: 'Eligible cost categories', detail: 'Research Staff; Data Collection; Equipment; Dissemination; Indirect ≤ 10%.', source: { docId: 'DOC-2', clause: '§3.2', page: 3 }, confidence: 0.95, reviewed: 'accepted' },
  { id: 'R-B3', grantId: 'G2', type: 'Reporting', title: 'Annual progress report', detail: 'Annual progress report incl. expenditure, due 30 Sep each award year.', source: { docId: 'DOC-2', clause: '§5.1', page: 5 }, confidence: 0.96, reviewed: 'accepted', due: '2026-09-30' },
  { id: 'R-B4', grantId: 'G2', type: 'Milestone', title: 'Wave 1 data collection', detail: 'Completed by 30 Jun 2026.', source: { docId: 'DOC-2', clause: '§5.3', page: 5 }, confidence: 0.95, reviewed: 'accepted', due: '2026-06-30' },
  { id: 'R-B5', grantId: 'G2', type: 'Milestone', title: 'Wave 2 data collection', detail: 'Completed by 31 Mar 2027.', source: { docId: 'DOC-2', clause: '§5.3', page: 5 }, confidence: 0.95, reviewed: 'accepted', due: '2027-03-31' },
  { id: 'R-B6', grantId: 'G2', type: 'Reporting', title: 'Open-access publication', detail: 'Publications open access within 6 months.', source: { docId: 'DOC-2', clause: '§6.1', page: 6 }, confidence: 0.9, reviewed: 'accepted' },

  { id: 'R-C1', grantId: 'G3', type: 'Reporting', title: 'Six-month progress & financial report', detail: 'Due 15 Oct 2026.', source: { docId: 'DOC-3', clause: '§4.1', page: 2 }, confidence: 0.97, reviewed: 'accepted', due: '2026-10-15' },
  { id: 'R-C2', grantId: 'G3', type: 'Evidence', title: 'Signed stipend register', detail: 'Stipends evidenced by register signed by each recipient.', source: { docId: 'DOC-3', clause: '§4.3', page: 3 }, confidence: 0.93, reviewed: 'accepted' },
  { id: 'R-C3', grantId: 'G3', type: 'Milestone', title: 'Cohort 1 enrolled', detail: 'By 15 May 2026.', source: { docId: 'DOC-3', clause: '§5', page: 3 }, confidence: 0.94, reviewed: 'accepted', due: '2026-05-15' },
  { id: 'R-C4', grantId: 'G3', type: 'Milestone', title: 'Cohort 1 completes curriculum', detail: 'By 30 Sep 2026.', source: { docId: 'DOC-3', clause: '§5', page: 3 }, confidence: 0.94, reviewed: 'accepted', due: '2026-09-30' },
  { id: 'R-C5', grantId: 'G3', type: 'Eligible cost', title: 'Eligible cost categories', detail: 'Instructors; Laptops & Connectivity; Venue; Learner Stipends.', source: { docId: 'DOC-3', clause: '§2', page: 1 }, confidence: 0.95, reviewed: 'accepted' },
];

const pay = (id: string, grantId: string, date: string, desc: string, cat: string, amt: number, ev: string[], by = 'Daniel Reyes'): Transaction =>
  ({ id, grantId, date, vendor: 'Riverbend payroll', description: desc, category: cat, amount: amt, evidenceIds: ev, enteredBy: by });

export const transactions: Transaction[] = [
  // ---- G1 Safe Water ----
  pay('T-1001', 'G1', '2026-01-31', 'Program staff salaries — January', 'Personnel', 8000, ['EV-2001']),
  pay('T-1002', 'G1', '2026-02-28', 'Program staff salaries — February', 'Personnel', 8000, ['EV-2002']),
  pay('T-1003', 'G1', '2026-03-31', 'Program staff salaries — March', 'Personnel', 8000, ['EV-2003']),
  pay('T-1004', 'G1', '2026-04-30', 'Program staff salaries — April', 'Personnel', 8000, ['EV-2004']),
  pay('T-1005', 'G1', '2026-05-31', 'Program staff salaries — May', 'Personnel', 8000, ['EV-2005']),
  pay('T-1006', 'G1', '2026-06-30', 'Program staff salaries — June', 'Personnel', 8000, ['EV-2006']),
  pay('T-1007', 'G1', '2026-07-31', 'Program staff salaries — July', 'Personnel', 8000, ['EV-2007']),
  pay('T-1008', 'G1', '2026-08-31', 'Program staff salaries — August', 'Personnel', 8000, []),
  pay('T-1009', 'G1', '2026-09-30', 'Program staff salaries — September', 'Personnel', 8000, ['EV-2009']),
  { id: 'T-1010', grantId: 'G1', date: '2026-04-14', vendor: 'Kesi Hardware Supply', description: 'Hand-pump replacement parts, 6 sets', category: 'Equipment & Materials', amount: 18600, evidenceIds: ['EV-2010'], quoteIds: ['EV-2011', 'EV-2012'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1011', grantId: 'G1', date: '2026-05-20', vendor: 'Lowland Borehole Services', description: 'Borehole rehabilitation, water points 1–3', category: 'Equipment & Materials', amount: 27450, evidenceIds: ['EV-2013'], quoteIds: ['EV-2031'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1012', grantId: 'G1', date: '2026-07-08', vendor: 'Lowland Borehole Services', description: 'Borehole rehabilitation, water points 4–6', category: 'Equipment & Materials', amount: 27450, evidenceIds: ['EV-2014'], quoteIds: ['EV-2015', 'EV-2016'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1013', grantId: 'G1', date: '2026-08-02', vendor: 'Aquatest Labs', description: 'Water-quality field test kits', category: 'Monitoring & Evaluation', amount: 4380, evidenceIds: ['EV-2017'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1014', grantId: 'G1', date: '2026-08-18', vendor: 'Kesi Community Hall', description: 'Venue hire — training cohort 1', category: 'Community Training', amount: 1200, evidenceIds: ['EV-2018'], enteredBy: 'Amara Osei' },
  { id: 'T-1015', grantId: 'G1', date: '2026-08-19', vendor: 'Brightline Print', description: 'Water committee training manuals (150)', category: 'Community Training', amount: 2340, evidenceIds: ['EV-2019'], enteredBy: 'Amara Osei' },
  { id: 'T-1016', grantId: 'G1', date: '2026-09-22', vendor: 'Kesi Community Hall', description: 'Venue hire — training cohort 2', category: 'Community Training', amount: 1200, evidenceIds: [], enteredBy: 'Amara Osei' },
  { id: 'T-1017', grantId: 'G1', date: '2026-09-23', vendor: 'Riverside Catering', description: 'Training refreshments, cohorts 1–2', category: 'Community Training', amount: 1860, evidenceIds: ['EV-2020'], enteredBy: 'Amara Osei' },
  { id: 'T-1018', grantId: 'G1', date: '2026-09-26', vendor: 'Riverside Catering', description: 'Committee closing gathering', category: 'Community Training', amount: 640, evidenceIds: ['EV-2021'], enteredBy: 'Amara Osei' },
  { id: 'T-1019', grantId: 'G1', date: '2026-03-10', vendor: 'Kesi Motors', description: 'Vehicle hire & fuel — baseline survey', category: 'Travel', amount: 4950, evidenceIds: ['EV-2022'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1020', grantId: 'G1', date: '2026-05-21', vendor: 'Kesi Motors', description: 'Vehicle hire — site supervision, WP 1–3', category: 'Travel', amount: 5200, evidenceIds: ['EV-2023'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1021', grantId: 'G1', date: '2026-07-10', vendor: 'Kesi Motors', description: 'Vehicle hire — site supervision, WP 4–6', category: 'Travel', amount: 4300, evidenceIds: [], enteredBy: 'Daniel Reyes' },
  { id: 'T-1022', grantId: 'G1', date: '2026-03-28', vendor: 'Field enumerators (8)', description: 'Baseline survey enumerator fees', category: 'Monitoring & Evaluation', amount: 3600, evidenceIds: ['EV-2024'], enteredBy: 'Daniel Reyes' },
  { id: 'T-1023', grantId: 'G1', date: '2026-06-30', vendor: 'Riverbend (internal)', description: 'Indirect cost recovery — H1 2026', category: 'Indirect Costs', amount: 6000, evidenceIds: ['EV-2025'], enteredBy: 'Daniel Reyes' },

  // ---- G2 Literacy Study ----
  pay('T-2001', 'G2', '2025-12-31', 'Research staff — Q4 2025', 'Research Staff', 13500, ['EV-3001']),
  pay('T-2002', 'G2', '2026-03-31', 'Research staff — Q1 2026', 'Research Staff', 13500, ['EV-3002']),
  pay('T-2003', 'G2', '2026-06-30', 'Research staff — Q2 2026', 'Research Staff', 13500, ['EV-3003']),
  pay('T-2004', 'G2', '2026-09-30', 'Research staff — Q3 2026', 'Research Staff', 13500, []),
  { id: 'T-2005', grantId: 'G2', date: '2026-04-15', vendor: 'Field enumerators (14)', description: 'Wave 1 assessment fieldwork', category: 'Data Collection', amount: 14200, evidenceIds: ['EV-3005'], enteredBy: 'Daniel Reyes' },
  { id: 'T-2006', grantId: 'G2', date: '2026-05-30', vendor: 'Kesi Mobile', description: 'Tablet data plans, wave 1', category: 'Data Collection', amount: 1150, evidenceIds: ['EV-3006'], enteredBy: 'Daniel Reyes' },
  { id: 'T-2007', grantId: 'G2', date: '2025-10-10', vendor: 'Orchard Devices', description: 'Assessment tablets ×12', category: 'Equipment', amount: 7680, evidenceIds: ['EV-3007'], quoteIds: ['EV-3008', 'EV-3009'], enteredBy: 'Daniel Reyes' },
  { id: 'T-2008', grantId: 'G2', date: '2026-09-12', vendor: 'Regional Education Research Forum', description: 'Conference registration — preliminary findings', category: 'Dissemination', amount: 1450, evidenceIds: ['EV-3010'], enteredBy: 'Amara Osei' },
  { id: 'T-2009', grantId: 'G2', date: '2026-06-30', vendor: 'Riverbend (internal)', description: 'Indirect cost recovery — FY to June', category: 'Indirect Costs', amount: 8000, evidenceIds: ['EV-3011'], enteredBy: 'Daniel Reyes' },

  // ---- G3 Digital Skills ----
  pay('T-3001', 'G3', '2026-04-30', 'Instructors — April', 'Instructors', 4000, ['EV-4001']),
  pay('T-3002', 'G3', '2026-05-31', 'Instructors — May', 'Instructors', 4000, ['EV-4002']),
  pay('T-3003', 'G3', '2026-06-30', 'Instructors — June', 'Instructors', 4000, ['EV-4003']),
  pay('T-3004', 'G3', '2026-07-31', 'Instructors — July', 'Instructors', 4000, ['EV-4004']),
  pay('T-3005', 'G3', '2026-08-31', 'Instructors — August', 'Instructors', 4000, ['EV-4005']),
  pay('T-3006', 'G3', '2026-09-30', 'Instructors — September', 'Instructors', 4000, ['EV-4006']),
  { id: 'T-3007', grantId: 'G3', date: '2026-05-06', vendor: 'Orchard Devices', description: 'Learner laptops ×20', category: 'Laptops & Connectivity', amount: 16400, evidenceIds: ['EV-4007'], quoteIds: ['EV-4008', 'EV-4009'], enteredBy: 'Daniel Reyes' },
  { id: 'T-3008', grantId: 'G3', date: '2026-05-10', vendor: 'Kesi Mobile', description: 'Connectivity hub & 6-month plan', category: 'Laptops & Connectivity', amount: 2950, evidenceIds: ['EV-4010'], enteredBy: 'Daniel Reyes' },
  { id: 'T-3009', grantId: 'G3', date: '2026-06-01', vendor: 'Eastgate Learning Centre', description: 'Venue, Jun–Nov (prepaid)', category: 'Venue', amount: 4800, evidenceIds: [], enteredBy: 'Amara Osei' },
  { id: 'T-3010', grantId: 'G3', date: '2026-09-30', vendor: 'Learner stipends (cohort 1)', description: 'Transport stipends, Jul–Sep', category: 'Learner Stipends', amount: 3600, evidenceIds: ['EV-4011'], enteredBy: 'Amara Osei' },
];

const ev = (id: string, grantId: string, filename: string, kind: Evidence['kind'], uploaded: string, extracted?: Evidence['extracted'], supports: string[] = [], uploadedBy = 'Daniel Reyes', extraction: Evidence['extraction'] = 'Textract'): Evidence =>
  ({ id, grantId, filename, kind, uploaded, uploadedBy, extraction, extracted, supports });

const payroll = (id: string, grantId: string, month: string, date: string, total: number) =>
  ev(id, grantId, `payroll_register_${month}.pdf`, 'Payroll register', date, { vendor: 'Riverbend payroll', date, total });

export const evidence: Evidence[] = [
  // G1
  payroll('EV-2001', 'G1', '2026-01', '2026-02-03', 8000),
  payroll('EV-2002', 'G1', '2026-02', '2026-03-03', 8000),
  payroll('EV-2003', 'G1', '2026-03', '2026-04-02', 8000),
  payroll('EV-2004', 'G1', '2026-04', '2026-05-04', 8000),
  payroll('EV-2005', 'G1', '2026-05', '2026-06-02', 8000),
  payroll('EV-2006', 'G1', '2026-06', '2026-07-02', 8000),
  payroll('EV-2007', 'G1', '2026-07', '2026-08-04', 8000),
  payroll('EV-2009', 'G1', '2026-09', '2026-10-02', 8000),
  ev('EV-2010', 'G1', 'kesi_hardware_inv_8812.pdf', 'Invoice', '2026-04-15', { vendor: 'Kesi Hardware Supply', date: '2026-04-14', total: 18600, lineItems: [{ desc: 'Hand-pump cylinder assembly ×6', amount: 11400 }, { desc: 'Riser pipes & rods ×6 sets', amount: 7200 }] }),
  ev('EV-2011', 'G1', 'quote_kesi_hardware.pdf', 'Quotation', '2026-04-08', { vendor: 'Kesi Hardware Supply', total: 18600 }),
  ev('EV-2012', 'G1', 'quote_delta_pumps.pdf', 'Quotation', '2026-04-08', { vendor: 'Delta Pumps Ltd', total: 19950 }),
  ev('EV-2013', 'G1', 'lowland_borehole_inv_0419.pdf', 'Invoice', '2026-05-22', { vendor: 'Lowland Borehole Services', date: '2026-05-20', total: 27450 }),
  ev('EV-2031', 'G1', 'quote_lowland_borehole_WP1-3.pdf', 'Quotation', '2026-05-02', { vendor: 'Lowland Borehole Services', total: 27450 }),
  ev('EV-2014', 'G1', 'lowland_borehole_inv_0502.pdf', 'Invoice', '2026-07-09', { vendor: 'Lowland Borehole Services', date: '2026-07-08', total: 27450 }),
  ev('EV-2015', 'G1', 'quote_lowland_WP4-6.pdf', 'Quotation', '2026-06-20', { vendor: 'Lowland Borehole Services', total: 27450 }),
  ev('EV-2016', 'G1', 'quote_greenfield_drilling.pdf', 'Quotation', '2026-06-21', { vendor: 'Greenfield Drilling', total: 29800 }),
  ev('EV-2017', 'G1', 'aquatest_receipt_5521.jpg', 'Receipt', '2026-08-03', { vendor: 'Aquatest Labs', date: '2026-08-02', total: 4830, note: 'Extracted total differs from recorded amount (USD 4,380). Possible transposition.' }),
  ev('EV-2018', 'G1', 'community_hall_receipt_aug.jpg', 'Receipt', '2026-08-19', { vendor: 'Kesi Community Hall', date: '2026-08-18', total: 1200 }, [], 'Amara Osei'),
  ev('EV-2019', 'G1', 'brightline_print_inv.pdf', 'Invoice', '2026-08-20', { vendor: 'Brightline Print', date: '2026-08-19', total: 2340 }, [], 'Amara Osei'),
  ev('EV-2020', 'G1', 'riverside_catering_0923.jpg', 'Receipt', '2026-09-24', { vendor: 'Riverside Catering', date: '2026-09-23', total: 1860 }, [], 'Amara Osei'),
  ev('EV-2021', 'G1', 'riverside_catering_0926.jpg', 'Receipt', '2026-09-27', { vendor: 'Riverside Catering', date: '2026-09-26', total: 640, lineItems: [{ desc: 'Buffet lunch ×40', amount: 420 }, { desc: 'Soft drinks', amount: 60 }, { desc: 'Beer & wine', amount: 160 }] }, [], 'Amara Osei'),
  ev('EV-2022', 'G1', 'kesi_motors_0310.pdf', 'Invoice', '2026-03-11', { vendor: 'Kesi Motors', date: '2026-03-10', total: 4950 }),
  ev('EV-2023', 'G1', 'kesi_motors_0521.pdf', 'Invoice', '2026-05-22', { vendor: 'Kesi Motors', date: '2026-05-21', total: 5200 }),
  ev('EV-2024', 'G1', 'enumerator_payment_sheet.pdf', 'Register', '2026-03-30', { date: '2026-03-28', total: 3600, note: '8 signed payee lines' }),
  ev('EV-2025', 'G1', 'indirect_allocation_memo_H1.pdf', 'Memo', '2026-07-01', { date: '2026-06-30', total: 6000 }),
  ev('EV-2026', 'G1', 'baseline_water_survey_report.pdf', 'Survey report', '2026-03-29', { date: '2026-03-29', note: 'Baseline survey of 6 water points across 4 villages' }, ['M-101'], 'Amara Osei', 'Manual'),
  ev('EV-2027', 'G1', 'commissioning_certificates_WP1-3.pdf', 'Certificate', '2026-06-12', { note: '3 signed certificates with geotagged photos: WP1, WP2, WP3' }, ['M-102', 'O-1'], 'Amara Osei'),
  ev('EV-2028', 'G1', 'commissioning_certificates_WP4-5.pdf', 'Certificate', '2026-09-29', { note: '2 signed certificates with geotagged photos: WP4, WP5' }, ['M-102', 'O-1'], 'Amara Osei'),
  ev('EV-2029', 'G1', 'attendance_cohort1_signed.pdf', 'Attendance sheet', '2026-08-21', { note: '58 distinct participant signatures across 3 sessions' }, ['M-103', 'O-2'], 'Amara Osei'),
  ev('EV-2030', 'G1', 'aquatest_results_WP1-5.pdf', 'Lab report', '2026-10-05', { note: '5 of 5 tested water points within national potable thresholds' }, ['O-3']),

  // G2
  payroll('EV-3001', 'G2', '2025-Q4', '2026-01-05', 13500),
  payroll('EV-3002', 'G2', '2026-Q1', '2026-04-03', 13500),
  payroll('EV-3003', 'G2', '2026-Q2', '2026-07-02', 13500),
  ev('EV-3005', 'G2', 'wave1_enumerator_payments.pdf', 'Register', '2026-04-18', { total: 14200 }),
  ev('EV-3006', 'G2', 'kesi_mobile_inv_may.pdf', 'Invoice', '2026-06-01', { vendor: 'Kesi Mobile', total: 1150 }),
  ev('EV-3007', 'G2', 'orchard_devices_inv_tablets.pdf', 'Invoice', '2025-10-11', { vendor: 'Orchard Devices', total: 7680 }),
  ev('EV-3008', 'G2', 'quote_orchard_tablets.pdf', 'Quotation', '2025-10-01', { vendor: 'Orchard Devices', total: 7680 }),
  ev('EV-3009', 'G2', 'quote_techhub_tablets.pdf', 'Quotation', '2025-10-02', { vendor: 'TechHub', total: 8340 }),
  ev('EV-3010', 'G2', 'rerf_registration_receipt.pdf', 'Receipt', '2026-09-13', { vendor: 'Regional Education Research Forum', total: 1450 }, [], 'Amara Osei'),
  ev('EV-3011', 'G2', 'indirect_allocation_memo_FY.pdf', 'Memo', '2026-07-01', { total: 8000 }),
  ev('EV-3012', 'G2', 'ethics_board_approval_letter.pdf', 'Approval letter', '2025-11-20', { date: '2025-11-18', note: 'Approval ref ERB-2025-114, valid 24 months' }, ['M-201'], 'Amara Osei', 'Manual'),
  ev('EV-3013', 'G2', 'wave1_field_completion_log.xlsx', 'Log', '2026-06-29', { note: '1,214 pupil assessments logged across 22 schools' }, ['M-202', 'O-4'], 'Amara Osei', 'Manual'),

  // G3
  payroll('EV-4001', 'G3', '2026-04', '2026-05-02', 4000),
  payroll('EV-4002', 'G3', '2026-05', '2026-06-02', 4000),
  payroll('EV-4003', 'G3', '2026-06', '2026-07-02', 4000),
  payroll('EV-4004', 'G3', '2026-07', '2026-08-03', 4000),
  payroll('EV-4005', 'G3', '2026-08', '2026-09-02', 4000),
  payroll('EV-4006', 'G3', '2026-09', '2026-10-02', 4000),
  ev('EV-4007', 'G3', 'orchard_devices_inv_laptops.pdf', 'Invoice', '2026-05-07', { vendor: 'Orchard Devices', total: 16400 }),
  ev('EV-4008', 'G3', 'quote_orchard_laptops.pdf', 'Quotation', '2026-04-28', { vendor: 'Orchard Devices', total: 16400 }),
  ev('EV-4009', 'G3', 'quote_techhub_laptops.pdf', 'Quotation', '2026-04-29', { vendor: 'TechHub', total: 17900 }),
  ev('EV-4010', 'G3', 'kesi_mobile_hub_inv.pdf', 'Invoice', '2026-05-11', { vendor: 'Kesi Mobile', total: 2950 }),
  ev('EV-4011', 'G3', 'stipend_register_cohort1_JulSep.pdf', 'Register', '2026-10-01', { total: 3600, note: '24 recipient lines; 3 lines unsigned' }, [], 'Amara Osei'),
  ev('EV-4012', 'G3', 'cohort1_enrollment_register.pdf', 'Register', '2026-05-14', { note: '24 learners enrolled' }, ['M-301', 'O-5'], 'Amara Osei', 'Manual'),
];

export const milestones: Milestone[] = [
  { id: 'M-101', grantId: 'G1', title: 'Baseline water survey completed', due: '2026-03-31', status: 'Complete', completed: '2026-03-29', requirementId: 'R-A14', evidenceIds: ['EV-2026'] },
  { id: 'M-102', grantId: 'G1', title: 'Six water points rehabilitated & commissioned', due: '2026-09-30', status: 'Reported complete', completed: '2026-09-28', requirementId: 'R-A10', evidenceIds: ['EV-2027', 'EV-2028'] },
  { id: 'M-103', grantId: 'G1', title: '120 water committee members trained', due: '2026-10-31', status: 'In progress', requirementId: 'R-A11', evidenceIds: ['EV-2029'] },
  { id: 'M-104', grantId: 'G1', title: 'Endline survey completed', due: '2026-12-15', status: 'Not started', evidenceIds: [] },
  { id: 'M-201', grantId: 'G2', title: 'Ethics board approval obtained', due: '2025-11-30', status: 'Complete', completed: '2025-11-18', requirementId: 'R-B1', evidenceIds: ['EV-3012'] },
  { id: 'M-202', grantId: 'G2', title: 'Wave 1 data collection complete', due: '2026-06-30', status: 'Complete', completed: '2026-06-27', requirementId: 'R-B4', evidenceIds: ['EV-3013'] },
  { id: 'M-203', grantId: 'G2', title: 'Wave 2 data collection complete', due: '2027-03-31', status: 'Not started', requirementId: 'R-B5', evidenceIds: [] },
  { id: 'M-301', grantId: 'G3', title: 'Cohort 1 enrolled', due: '2026-05-15', status: 'Complete', completed: '2026-05-14', requirementId: 'R-C3', evidenceIds: ['EV-4012'] },
  { id: 'M-302', grantId: 'G3', title: 'Cohort 1 completes curriculum', due: '2026-09-30', status: 'Reported complete', completed: '2026-09-30', requirementId: 'R-C4', evidenceIds: [] },
];

// Results as recorded by the project team. Entries without evidence are shown as UNVERIFIED and never totalled as verified.
export const outcomes: Outcome[] = [
  { id: 'O-1', grantId: 'G1', metric: 'Water points rehabilitated & commissioned', target: 6, entries: [
    { label: 'WP1–WP3', value: 3, evidenceIds: ['EV-2027'], recordedBy: 'Amara Osei', date: '2026-06-12' },
    { label: 'WP4–WP5', value: 2, evidenceIds: ['EV-2028'], recordedBy: 'Amara Osei', date: '2026-09-29' },
    { label: 'WP6', value: 1, evidenceIds: [], recordedBy: 'Amara Osei', date: '2026-09-29' },
  ] },
  { id: 'O-2', grantId: 'G1', metric: 'Water committee members trained', target: 120, entries: [
    { label: 'Cohort 1', value: 58, evidenceIds: ['EV-2029'], recordedBy: 'Amara Osei', date: '2026-08-21' },
    { label: 'Cohort 2', value: 61, evidenceIds: [], recordedBy: 'Amara Osei', date: '2026-09-25' },
  ] },
  { id: 'O-3', grantId: 'G1', metric: 'Water points passing quality tests', entries: [
    { label: 'WP1–WP5 tests', value: 5, evidenceIds: ['EV-2030'], recordedBy: 'Daniel Reyes', date: '2026-10-05' },
  ] },
  { id: 'O-4', grantId: 'G2', metric: 'Pupil assessments completed (wave 1)', entries: [
    { label: 'Wave 1', value: 1214, evidenceIds: ['EV-3013'], recordedBy: 'Amara Osei', date: '2026-06-29' },
  ] },
  { id: 'O-5', grantId: 'G3', metric: 'Learners enrolled (cohort 1)', entries: [
    { label: 'Cohort 1', value: 24, evidenceIds: ['EV-4012'], recordedBy: 'Amara Osei', date: '2026-05-14' },
  ] },
];

export const reports: Report[] = [
  { id: 'RPT-0', grantId: 'G1', title: 'Interim Narrative Report', period: { from: '2026-01-01', to: '2026-06-30' }, due: '2026-07-31', requirementId: 'R-A2', status: 'Submitted', generatedAt: '2026-07-20T11:00:00', approvedBy: 'Dr. Leila Haddad', approvedAt: '2026-07-28T17:15:00', submittedAt: '2026-07-30T09:40:00', acknowledgedGaps: [] },
  { id: 'RPT-1', grantId: 'G1', title: 'Q3 2026 Financial & Progress Report', period: { from: '2026-07-01', to: '2026-09-30' }, due: '2026-10-31', requirementId: 'R-A1', status: 'Draft', generatedAt: '2026-10-16T09:12:00', acknowledgedGaps: [] },
  { id: 'RPT-2', grantId: 'G2', title: 'Annual Progress Report — Year 1', period: { from: '2025-09-01', to: '2026-08-31' }, due: '2026-09-30', requirementId: 'R-B3', status: 'Submitted', generatedAt: '2026-09-19T14:03:00', approvedBy: 'Dr. Leila Haddad', approvedAt: '2026-09-25T16:40:00', submittedAt: '2026-09-28T10:05:00', acknowledgedGaps: [] },
  { id: 'RPT-3', grantId: 'G3', title: 'Six-Month Progress & Financial Report', period: { from: '2026-04-01', to: '2026-09-30' }, due: '2026-10-15', requirementId: 'R-C1', status: 'Not started', acknowledgedGaps: [] },
];

export const auditSeed: AuditEntry[] = [
  { id: 'A-1', at: '2026-01-06T10:02:00', actor: 'Amara Osei', action: 'Uploaded agreement', target: 'DOC-1', detail: 'Harrowgate_Grant_Agreement_HF-2026-0147.pdf → s3://grantloom-docs/riverbend/G1/' },
  { id: 'A-2', at: '2026-01-06T10:04:00', actor: 'GrantLoom AI', action: 'Extracted requirements', target: 'DOC-1', detail: '14 requirements extracted (Textract + Bedrock); pending human review' },
  { id: 'A-3', at: '2026-01-07T09:30:00', actor: 'Daniel Reyes', action: 'Accepted requirements', target: 'G1', detail: '13 accepted, 1 left pending (R-A12)' },
  { id: 'A-3b', at: '2026-07-28T17:15:00', actor: 'Dr. Leila Haddad', action: 'Approved report', target: 'RPT-0', detail: 'Approval attestation recorded' },
  { id: 'A-3c', at: '2026-07-30T09:40:00', actor: 'Amara Osei', action: 'Recorded submission', target: 'RPT-0', detail: 'Uploaded to Harrowgate grantee portal. No funder acknowledgement recorded yet.' },
  { id: 'A-4', at: '2026-09-25T16:40:00', actor: 'Dr. Leila Haddad', action: 'Approved report', target: 'RPT-2', detail: 'Approval attestation recorded' },
  { id: 'A-5', at: '2026-09-28T10:05:00', actor: 'Amara Osei', action: 'Recorded submission', target: 'RPT-2', detail: 'Submitted by email to Research Grants Office. No funder acknowledgement recorded yet.' },
  { id: 'A-6', at: '2026-09-29T15:11:00', actor: 'Amara Osei', action: 'Uploaded evidence', target: 'EV-2028', detail: 'commissioning_certificates_WP4-5.pdf' },
  { id: 'A-7', at: '2026-10-05T11:20:00', actor: 'Daniel Reyes', action: 'Uploaded evidence', target: 'EV-2030', detail: 'aquatest_results_WP1-5.pdf' },
  { id: 'A-8', at: '2026-10-16T09:12:00', actor: 'GrantLoom AI', action: 'Generated report draft', target: 'RPT-1', detail: 'Draft built from 23 transactions, 30 evidence items; 9 gaps flagged' },
];

// Written variance explanations recorded by the finance lead (keyed grantId:category).
export const varianceNotes: Record<string, { note: string; by: string; at: string }> = {
  'G1:Equipment & Materials': { note: 'Rehabilitation works for all six water points were scheduled before the October rains; the line remains within its full-year budget.', by: 'Daniel Reyes', at: '2026-10-10T12:00:00' },
};
