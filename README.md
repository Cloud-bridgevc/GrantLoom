# GrantLoom

AI-native grant management, compliance coordination and reporting. Organize budgets, receipts, milestones, outcome evidence, deadlines and funder-specific requirements, and draft funder reports with visible source references.

## Run the demo

```bash
cd web && npm install && npm run dev
```

Open http://localhost:5173 — the public website. **Open live demo** (or `/#/app`) opens the dashboard.

Everything in the demo is fictional: Riverbend Community Health Collective, three grants (Harrowgate Foundation, Northfield Science Trust, Meridian Civic Fund), their agreements, budgets, 42 transactions, receipts, milestones and recorded results. State is kept in the browser; **Reset demo** restores it.

### Suggested walkthrough

1. **Overview** — portfolio, burn vs time elapsed, deadlines, critical gaps.
2. **Requirements (AI)** — agreement clauses beside extracted requirements; hover to highlight the source clause; accept the pending §6.2(c) item.
3. **Evidence mapping** — each requirement's status and linked documents; confirm/reject links.
4. **Expenditure register → Upload** on T-1008 (August payroll) — the missing-receipt gap clears.
5. **Budget & variance** — Travel is +61% and over budget; sign in as Daniel Reyes (Finance Lead) to record an explanation.
6. **Reports → Q3 2026 Financial & Progress Report** — draft with citations (hover them), `UNVERIFIED` and `MISSING` labels. Send for approval, switch to Dr. Leila Haddad (approver), acknowledge critical gaps, attest, approve, then record submission.
7. **Grant assistant** — try “How many households have improved water access?” (it refuses to guess).
8. **Audit trail** — every action above is logged.

## Repository

| Path | Contents |
|---|---|
| `web/` | React + Vite app: public site (`src/site`), dashboard (`src/app`), fictional data (`src/data/demo.ts`), analysis engine (`src/engine`) |
| `server/` | AWS Lambda handlers (TypeScript), PostgreSQL schema, SAM template |
| `docs/ARCHITECTURE.md` | AWS architecture and the guardrails that keep reports honest |
| `docs/HUBSPOT.md` | CRM properties, pipelines and workflows by segment |

## Principles enforced in code

- Financial figures are sums of recorded transactions; the model never produces numbers (`server/src/handlers/draft-report.ts` rejects drafts with ungrounded digits).
- No fabricated outcomes, beneficiaries or funder approvals: unrecorded metrics render as `MISSING`, results without evidence as `UNVERIFIED`.
- Reports require approval by an authorized signatory (enforced in the reducer and by a database trigger) before a submission can be recorded.

## Status

- The web demo builds and runs on its own. Textract and Bedrock steps are simulated in the browser and labeled that way.
- The server code typechecks but has not been deployed or run against AWS. Before deploying: add a presigned-upload API, the remaining CRUD endpoints, Cognito, an EventBridge rule for the receipt Lambda, and confirm Claude Opus 5.5 access in your Bedrock region.
- Pricing on the website is placeholder.

## Launch readiness (glow-up)

- Website (`web/`): problem section with three sourced statistics, what-we-solve, comparison table, AI section, founder cards, roadmap and FAQ, with scroll-reveal motion that respects reduced motion. Sections live in `web/src/site/Glow.tsx` (generated markup); styles and motion in `web/public/glow.css` and `web/public/glow.js`.
- Fixed: clicking the site's in-page nav links (e.g. “Pricing”) changed the hash route and blanked the page. In-page links now scroll, and unknown hashes fall back to the site.
- New routes: `#/privacy` and `#/terms` (review drafts). Footer credits the founders.
- Ship assets in `web/public/`: favicon, OG image, icons, manifest, sitemap, robots, `_headers`; `web/vercel.json` security headers; meta tags and founders JSON-LD in `web/index.html`.

### Content to confirm before launch
- **Founders:** Chukwudi Hank (Founder/CEO, confirmed) and Ibrahim Musa (Co-founder/CTO, still a placeholder) — edit in `web/src/site/Glow.tsx`, the footer in `web/src/site/Site.tsx` and the JSON-LD in `web/index.html`.
- Contact email `hello@grantloom.site` is a placeholder — create the forward or replace it.
- Statistics (Giving USA 2025) — re-check figures and links.
- Privacy notice and terms need operator details and governing law.
- Workspace page titles are `<h2>`; consider making them `<h1>` for accessibility.
