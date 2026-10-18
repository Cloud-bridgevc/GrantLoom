# GrantLoom architecture (AWS)

```
 Browser (React app, CloudFront + S3 static hosting, Cognito sign-in)
   │  presigned PUT                       │  HTTPS (JWT)
   ▼                                      ▼
 S3 documents bucket ── ObjectCreated ──► API Gateway (HTTP API) ──► Lambda API handlers
 (KMS, versioned,        │                                             │
  Object Lock)           ├─► Lambda extract-requirements ─► Textract (text detection)
                         │                                 └► Bedrock (Claude) structured extraction
                         └─► Lambda analyze-receipt ─────► Textract AnalyzeExpense
                                                           │
                         RDS / Aurora PostgreSQL ◄──────────┘  (grants, budget lines, transactions,
                                                                 evidence links, reports, audit log)
 EventBridge Scheduler (daily) ─► Lambda reminders ─► SES email to grant team
 Website demo form ─► Lambda demo-request ─► HubSpot CRM (contact + deal)
```

## Services and responsibilities

| Concern | Service | Notes |
|---|---|---|
| Documents & evidence | **Amazon S3** | Key layout `org/<org>/grant/<grant>/{agreement,evidence}/<documentId>.<ext>`. SSE-KMS, versioning, Object Lock for audit retention, public access blocked. Uploads use presigned URLs; the `documents` row (with SHA-256) is created when the URL is issued. |
| Text & expense extraction | **Amazon Textract** | `StartDocumentTextDetection` for agreements (multi-page PDF); `AnalyzeExpense` for receipts and invoices. Unsupported formats are marked `unsupported`, not guessed. |
| Requirement analysis & drafting | **Amazon Bedrock** (Claude Opus 5.5, `anthropic.claude-opus-5-5`, via `@anthropic-ai/bedrock-sdk` Mantle client) | Strict tool schemas for structured output. Requirements without a resolvable clause citation are dropped. Model refusals route the item to manual handling. |
| Records | **PostgreSQL** (RDS/Aurora) | See `server/db/schema.sql`. Money lives only in `transactions` and `budget_lines`. Approval and submission order is enforced by a trigger; `audit_log` is append-only via trigger. |
| Reminders | **AWS Lambda** + EventBridge Scheduler | Daily run; 30/14/7/1-day and weekly-overdue notices; idempotent via `reminders_sent`. |
| Auth | Amazon Cognito | Roles: program, finance, approver, viewer. `users.can_approve_reports` marks the authorized signatory. Row access via `grant_users`. |

## Guardrails that keep reports honest

1. **Figures from records only.** The drafting Lambda computes every number in SQL (`buildFacts`) and gives Claude placeholders (`{{fact:id}}`). `validateDraft` rejects any draft containing a digit outside a placeholder or clause reference, or citing an unknown id.
2. **Missing stays missing.** Required metrics with no recorded value (e.g. household reach) are passed as gaps and rendered as `MISSING`. Results without linked documents are marked unverified and kept out of verified totals.
3. **Humans own judgment.** Variance explanations are human-authored (`variance_explanations.author`). Extracted requirements start `pending` until someone reviews them.
4. **Approval before submission.** Only a user with `can_approve_reports` can approve; critical gaps need a written acknowledgement first; submission can only be recorded after approval. GrantLoom never sends reports to funders and records a funder acknowledgement only when one is uploaded.
5. **Audit everything.** Uploads, AI actions (with model id), reviews, approvals, submissions and reminders all write to `audit_log`.

## Demo vs production

The `web/` app runs fully in the browser on fictional data. Its `src/engine` mirrors the production logic (variance, gap detection, mapping, drafting, assistant retrieval) deterministically, so the demo works without AWS. Textract/Bedrock steps are simulated and labeled as such in the UI.
