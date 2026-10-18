# HubSpot CRM plan

## Custom properties

| Object | Property | Type | Values |
|---|---|---|---|
| Contact, Company, Deal | `grantloom_segment` | enum | `ngo`, `foundation`, `research`, `consultant`, `other` |
| Contact | `grantloom_active_grants` | enum | `1–5`, `6–25`, `26–100`, `100+` |
| Contact | `grantloom_demo_notes` | text | Free text from the demo form |
| Company | `grantloom_plan` | enum | `community`, `organization`, `institution` |
| Company | `grantloom_workspace_id` | text | Links CRM to the product org (`organizations.hubspot_company_id`) |
| Company | `grantloom_onboarding_stage` | enum | `kickoff`, `first_agreement`, `ledger_connected`, `first_report`, `live` |

## Pipelines

**Demo Requests** — New request → Qualified → Demo scheduled → Demo held → Trial / proposal → Won · Lost
**Customer Onboarding** — Kickoff → First agreement extracted → Ledger imported → First report approved → Live (handoff to CS)

## Workflows by segment

| Workflow | Trigger | Actions |
|---|---|---|
| **Demo routing** | Deal created in Demo Requests | Rotate owner by `grantloom_segment` (NGO team, Foundations team, Research team, Partners for consultants). Create task “Respond within 1 business day”. Send confirmation email with booking link. |
| **NGO nurture** | Segment = ngo, no meeting booked in 3 days | 3-email sequence: receipts & evidence library → gap detection before deadlines → report drafting with source references. Highlight Community/Organization plans and nonprofit discount. |
| **Foundation track** | Segment = foundation | Route to senior AE. Send grantee-portfolio overview; offer a pilot with 3–5 grantees. Enroll associated grantee contacts only if they opt in themselves. |
| **Research institution track** | Segment = research | Route to research AE; send sponsored-research brief (ethics conditions, multi-year awards, effort reporting). Add a security/procurement questionnaire task. |
| **Grant consultant partner** | Segment = consultant | Route to partnerships. Send partner program info; create company with `partner` type; multi-client workspace demo. |
| **Demo no-show** | Meeting outcome = no-show | Reschedule email after 2 hours; task for owner after 2 days. |
| **Post-demo follow-up** | Deal stage → Demo held | Send recap + trial link within 24h; task to confirm decision-maker and approver role. |
| **Closed won → onboarding** | Deal stage → Won | Create Onboarding deal; set company `grantloom_plan`; create kickoff task for CSM; send welcome email with secure upload instructions. |
| **Onboarding nudges** | Onboarding stage unchanged 7 days | Email CSM + customer champion with the next step (e.g. “Upload your first agreement”). |
| **Product signals** | Product webhook → company property update | GrantLoom backend PATCHes `grantloom_onboarding_stage` when: first agreement extracted, first ledger import, first report approved. Stage changes advance the Onboarding pipeline. |

## Data handling

- Only form fields the visitor submits are sent. Consent is required (`hs_legal_basis`).
- No grant documents, financial records, or beneficiary data are ever sent to HubSpot; product signals are stage names and timestamps only.
- Private-app token stored in AWS Secrets Manager; scopes: `crm.objects.contacts.write`, `crm.objects.deals.write`, `crm.objects.companies.write`.

Implementation: `server/src/handlers/demo-request.ts`.
