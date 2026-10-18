-- GrantLoom PostgreSQL schema (Amazon RDS / Aurora PostgreSQL 16)
-- Principle: monetary figures are stored only on transactions and budget lines; every report figure is a query.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('program', 'finance', 'approver', 'viewer');
CREATE TYPE review_state AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE report_status AS ENUM ('not_started', 'draft', 'in_review', 'approved', 'submitted');
CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'reported_complete', 'complete');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hubspot_company_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  cognito_sub text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role user_role NOT NULL,
  can_approve_reports boolean NOT NULL DEFAULT false -- authorized signatory flag, set by org admin
);

CREATE TABLE funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  funder_type text,
  submission_channel text
);

CREATE TABLE grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  funder_id uuid NOT NULL REFERENCES funders(id),
  code text NOT NULL,
  title text NOT NULL,
  award_amount numeric(14,2) NOT NULL CHECK (award_amount >= 0), -- contractual, from the signed agreement
  currency char(3) NOT NULL DEFAULT 'USD',
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date > start_date),
  variance_threshold numeric(5,4) NOT NULL DEFAULT 0.10,
  UNIQUE (org_id, code)
);

CREATE TABLE grant_users (
  grant_id uuid REFERENCES grants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (grant_id, user_id)
);

CREATE TABLE budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  category text NOT NULL,
  approved_amount numeric(14,2) NOT NULL CHECK (approved_amount >= 0),
  UNIQUE (grant_id, category)
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id),
  kind text NOT NULL,                       -- 'agreement' | 'receipt' | 'certificate' | ...
  s3_bucket text NOT NULL,
  s3_key text NOT NULL,
  s3_version_id text,
  sha256 text NOT NULL,
  filename text NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  extraction_status text NOT NULL DEFAULT 'pending', -- pending | complete | unsupported | failed
  extracted jsonb,                         -- Textract output (normalized)
  UNIQUE (s3_bucket, s3_key, s3_version_id)
);

-- Clause-level text from agreements, used for citations and assistant retrieval.
CREATE TABLE document_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ref text NOT NULL,          -- e.g. '§6.3'
  page int NOT NULL,
  heading text,
  body text NOT NULL,
  search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(heading,'') || ' ' || body)) STORED
);
CREATE INDEX ON document_clauses USING gin (search);

CREATE TABLE requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  clause_id uuid NOT NULL REFERENCES document_clauses(id), -- every requirement must cite a clause
  type text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  due_date date,
  requires_metric text,
  model_confidence numeric(4,3),
  model_id text NOT NULL,
  review review_state NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id),
  budget_line_id uuid NOT NULL REFERENCES budget_lines(id),
  txn_date date NOT NULL,
  vendor text NOT NULL,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  is_payroll boolean NOT NULL DEFAULT false,
  external_ref text,           -- accounting system id
  entered_by uuid REFERENCES users(id),
  entered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON transactions (grant_id, txn_date);

CREATE TABLE transaction_documents (
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id),
  role text NOT NULL DEFAULT 'support', -- 'support' | 'quotation'
  PRIMARY KEY (transaction_id, document_id)
);

CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id),
  requirement_id uuid REFERENCES requirements(id),
  title text NOT NULL,
  due_date date NOT NULL,
  status milestone_status NOT NULL DEFAULT 'not_started',
  completed_on date
);

CREATE TABLE milestone_documents (
  milestone_id uuid REFERENCES milestones(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id),
  PRIMARY KEY (milestone_id, document_id)
);

-- Results exactly as recorded by staff. Verified = has at least one linked document.
CREATE TABLE outcome_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id),
  metric text NOT NULL,
  label text NOT NULL,
  value numeric(14,2) NOT NULL,
  target numeric(14,2),
  recorded_by uuid NOT NULL REFERENCES users(id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE outcome_documents (
  outcome_entry_id uuid REFERENCES outcome_entries(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id),
  PRIMARY KEY (outcome_entry_id, document_id)
);

CREATE TABLE evidence_links (
  requirement_id uuid REFERENCES requirements(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id),
  proposed_by text NOT NULL,           -- 'system' | model id
  confidence numeric(4,3),
  decision review_state NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES users(id),
  PRIMARY KEY (requirement_id, document_id)
);

CREATE TABLE variance_explanations (
  budget_line_id uuid REFERENCES budget_lines(id),
  period_end date NOT NULL,
  note text NOT NULL,                  -- human-authored only
  author uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (budget_line_id, period_end)
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES grants(id),
  requirement_id uuid REFERENCES requirements(id),
  title text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  status report_status NOT NULL DEFAULT 'not_started',
  draft jsonb,                         -- sections with segments + citations
  facts_snapshot jsonb,                -- the computed figures the draft was built from
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  submitted_at timestamptz,
  submission_channel text,
  funder_acknowledgement_doc uuid REFERENCES documents(id), -- only set when a real acknowledgement is uploaded
  CHECK (status <> 'approved' OR approved_by IS NOT NULL),
  CHECK (status <> 'submitted' OR (approved_by IS NOT NULL AND submitted_at IS NOT NULL))
);

CREATE TABLE report_gap_acknowledgements (
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  gap_key text NOT NULL,
  note text NOT NULL,
  acknowledged_by uuid NOT NULL REFERENCES users(id),
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, gap_key)
);

CREATE TABLE reminders_sent (
  key text PRIMARY KEY,                -- e.g. 'report:<id>:7d'
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only audit log.
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id),
  at timestamptz NOT NULL DEFAULT now(),
  actor_user uuid REFERENCES users(id),
  actor_system text,                   -- e.g. 'bedrock:anthropic.claude-opus-5-5', 'textract'
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  detail jsonb
);
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_log is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- Only an authorized signatory can move a report to approved.
CREATE OR REPLACE FUNCTION enforce_report_approval() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    IF OLD.status <> 'in_review' THEN RAISE EXCEPTION 'report must be in review before approval'; END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.approved_by AND can_approve_reports) THEN
      RAISE EXCEPTION 'approver is not an authorized signatory';
    END IF;
  END IF;
  IF NEW.status = 'submitted' AND OLD.status <> 'approved' THEN
    RAISE EXCEPTION 'report must be approved before submission is recorded';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER reports_approval_guard BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION enforce_report_approval();

-- Budget vs actual (used by variance intelligence and report drafting).
CREATE VIEW budget_actuals AS
SELECT bl.id AS budget_line_id, bl.grant_id, bl.category, bl.approved_amount,
       coalesce(sum(t.amount), 0) AS actual,
       count(t.id) AS txn_count,
       count(t.id) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM transaction_documents td WHERE td.transaction_id = t.id AND td.role = 'support')) AS unsupported_count
FROM budget_lines bl LEFT JOIN transactions t ON t.budget_line_id = bl.id
GROUP BY bl.id;
