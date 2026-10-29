# BAG Referral Partner Portal — Stage 1 audit

**Date:** 29 October 2026
**Scope:** inspect the portal that already exists. No product changes, no production writes, no deploy.
**Verdict:** a live referral portal exists and is safe to keep running for its current brokerage. It is **not ready** to launch as The Buyer Assist Group partner portal described in this brief (partner finds customers and stock, checks progress, takes action, with no training).

Stage 2 (a prioritised build plan) is out of scope. A short focus list is at the end only so the next run knows where to start.

---

## Confirmed repo and live URL

| Item | Value |
|---|---|
| Repo | [JustaTREE86/buyerassist](https://github.com/JustaTREE86/buyerassist) |
| Live portal | https://thebuyerassist.com.au/portal |
| Real board route | `/portal/:slug` — the only slug wired in code and answering in production is `ready-finance` |
| Sales demos (not the product) | https://thebuyerassist.com.au/portal-demo and https://thebuyerassist.com.au/portal-demo/ready-finance |
| KO Cars board (UX reference only) | https://brokenmind.com.au/ko (this site 308s `/dealer/ko-cars` there). Not modified. |

Checked live on 29 Oct 2026, signed out only. One login attempt used a dummy password to confirm the error text. No real credential was used. No deal rows were read.

---

## What exists today

The portal is a multi-tenant brokerage board, already deployed. It is the same shape as the KO Cars deal tracker: one row per deal, rows grouped by stage, colour plus the written stage name, click a row to open the history. It is not a chart dashboard.

```
Browser  /portal/:slug          page-portal.jsx  (PortalPage)
            │
            ▼
         /api/portal?action=    api/portal.js     (one Vercel function)
            │
            ├── login | logout | session | deals | notes | partners
            │     api/_portal-routes/*.js
            ▼
         Supabase (service role)   portal_orgs, portal_partners,
                                   portal_deals, portal_deal_notes
```

**Roles** (`api/_portal-config.js`, `api/_portal-session.js`):

- **owner** — Buyer Assist support. Password is the env var `PORTAL_OWNER_PASSWORD` (Leonie’s support login). It is not in the repo. It signs in to every org the code knows about, with read and write.
- **staff** — the brokerage. Passwords are per-person env vars. Today the only roster is Ready Finance (Ben, Alana). Read and write on that org’s board.
- **partner** — a referral firm. Access code is generated in the app, shown once, stored as a SHA-256 hash on `portal_partners`. They see only deals with their `partner_id`. They can post a note on those deals. They cannot add a deal, change a stage, edit details, or archive.

**Session:** cookie `ba_portal_session`, HttpOnly, Secure, SameSite=Strict, 12 hours, HMAC-SHA256. Payload includes `sur: "portal"` so a KO Cars dealer cookie cannot be replayed here, and the reverse is rejected because the dealer cookie has no portal surface marker. Signing secret is the shared env var `DEALER_SESSION_SECRET`.

**Data** (`supabase/2026-08-11-create-referral-portal.sql`, `supabase/2026-08-12-portal-partner-selfserve.sql`):

| Table | Columns that matter |
|---|---|
| `portal_orgs` | `slug`, `name`, `short_name`, `accent`, `logo_url`, `logo_white_url`, `domain_label`, `item_label`, `customer_label`, `stages[]`, `active` |
| `portal_partners` | `org_id`, `slug`, `name`, `kind`, `accent`, `active`, `contact_name`, `contact_email`, `access_code_hash`, `code_set_at`, `created_by` |
| `portal_deals` | `org_id`, `partner_id` (nullable), `subject`, `subject_details[]` (max 4), `customer_name`, `customer_mobile`, `customer_email`, `status`, `archived`, `created_at`, `updated_at`, `created_by`, `updated_by` |
| `portal_deal_notes` | `deal_id`, `note`, `visibility` (`all` or `internal`), `author_role` (`staff` or `partner`), `created_at`, `created_by` |

There is no stock number, registration, listing URL, vehicle make/model, or finance amount column. RLS is enabled with no policies (deny-all for anon and authenticated). The API uses the service role and must scope every query itself. That scoping is in `api/_portal-db.js`.

**The only org in code and in production** is Ready Finance Group. `PORTAL_LOGINS` has a single key, `ready-finance`. A signed-out call to `GET /api/portal?action=session&org=ready-finance` returns that org’s public login branding (name, short name, accent `#1681B7`, logos, domain label `partners.readyfinance.com.au`) and does not return stages, partners, or deals. The same call with `buyer-assist` or `the-buyer-assist-group` returns `org: null`. `POST /api/portal?action=login` with an unknown org returns 404 `Unknown portal.`

The SQL seed sets Ready Finance’s labels to `Buyer / property` and `Applicant`, and a home-loan stage list (`New Referral`, `Contacting Buyer`, `Fact Find Booked`, … `Settled`, `On Hold`, `Fell Through`). The seed also inserts four placeholder referrers (Coastline, Ashgrove, Meridian, Pinnacle). Whether those rows are still in the live database was not checked. The second migration says they are demo names and that re-running the first migration recreates them.

**Page chrome.** `app.jsx` renders `PortalPage` with no site nav, footer, or tweaks panel. The board’s own header uses the org logo from the database. The footer line credits BrokenMind Software.

### Real portal vs demos

| | Real | Demos |
|---|---|---|
| Routes | `/portal`, `/portal/:slug` | `/portal-demo`, `/portal-demo/ready-finance` |
| Files | `page-portal.jsx`, `api/portal.js`, `api/_portal-*` | `page-portal-demo.jsx`, `page-rf-demo.jsx` |
| Data | Supabase | Invented in the page. No API, no login |
| Live check | `/portal` renders “This portal is not available.” `/portal/ready-finance` is the login screen for Ready Finance Group | Both demo URLs return the site shell with `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` |

`/portal` with no slug is intentional: there is no directory of brokerages (`page-portal.jsx`).

### How this compares with the KO board

The live KO page (https://www.brokenmind.com.au/ko) is still “KO Cars Deal Tracker”. Its public script `/ko/page-dealer.jsx` lays the board out as stage groups, vehicle first. Columns on the sheet are Vehicle, Broker, Customer, Phone, Latest note, Status. Stock number, rego, and price live on the add/edit form and on the invoice lookup, not as sheet columns. Search, stage filter, and sort were removed on 23 Oct 2026 because the board is short enough to scan. Money is deliberately absent.

The BAG portal copied that pattern (shared `.board-*` styles in `styles.css`, expanding row, stage colour). It did not copy KO stock lookup, invoicing, or the `deals` table. Those stay on the KO side. `vercel.json` 308s `/dealer/ko-cars` to https://brokenmind.com.au/ko. The KO API on this domain is still deployed: `GET /api/dealer/session` returns 200 and the KO status list while signed out; `GET /api/dealer/deals` returns 401.

The brief asks for a KO-simple list **and** for stock number, finance amount, and search to be on the sheet. The current KO sheet does not show stock number or money. Copying the KO sheet column-for-column would miss the brief. The useful part of the KO philosophy is: one vertical list, the asset in the first column, written status, no charts, no training.

---

## Gap matrix

| # | Area | Status | One-line finding |
|---|---|---|---|
| 1 | Excel-style vertical table | Partial | Stage-grouped table exists. No sticky header, no column sort, not one flat sheet. |
| 2 | Referral columns and search | Partial | Customer, phone, status, free-text headline. No date, stock no., finance amount, last-update column, or action column. |
| 3 | Vehicle / stock linking | Missing | No stock, listing URL, or View Stock. Stock and finance are not separate fields. |
| 4 | Fast referral submit | Partial | Staff can add a deal in one modal. A partner cannot. No stock/URL/price, no confirmation, no duplicate check. |
| 5 | Statuses and note privacy | Partial | Stages are whatever the org row says (seeded as home loans). Internal notes exist. No lender/risk/doc fields. |
| 6 | Detail side panel | Partial | Detail is an expanding row plus a modal. Search and filters stay put. It is not a side panel. |
| 7 | Partner onboarding | Partial | Staff can create a firm and copy a code. Nothing is emailed. The partner cannot then lodge a referral. |
| 8 | Security | Present | Org and partner scope are enforced on the server. Residual risks are in the risk list below. |
| 9 | Work-first dashboard | Partial | Stage groups show a count. There is no Active / Awaiting Contact / In Progress / Approved / Settled strip. There are also no charts. |
| 10 | Internal admin across partners | Partial | Staff on one org see every partner’s deals and manage the partner list. There is no BAG-wide console. KO workflows are not duplicated inside the portal. |
| 11 | BAG branding, accessibility, tone | Partial | The board is quiet and training-light. Live branding is Ready Finance, not Buyer Assist. Accessibility basics are in place, with gaps. |
| 12 | Pre-launch testing | Missing | No automated tests. This audit did not sign in, so CRUD, isolation, mobile, and empty states are unread on a populated board. |
| 13 | Technical risks | Partial | The split from the KO `deals` table is documented in SQL. Several launch risks are still open. |
| 14 | Production launch readiness | Partial | The Ready Finance portal is live. The BAG stock-referral launch in this brief is not ready. |

### 1. Excel-style vertical table — Partial

Evidence:

- `PortalGroup` in `page-portal.jsx` renders a `<table class="board-table">` per stage, not a card wall and not a chart.
- Columns: item label, customer label, Phone, Latest note, Status.
- Search box, referral-partner filter (staff), and Active / Removed view are in `.deal-controls`.
- Status colour is `portalTone()` plus the written stage. Colour is not the only signal.
- Desktop table `min-width: 820px` (`styles.css`, `.board-table`). Below 900px the header is visually hidden and each cell stacks with a `data-label`. That is a usable phone layout. It is not a sticky desktop sheet.
- `.board-table th` has no `position: sticky`. The sticky bars in `styles.css` are the public nav, a marketing column, and the demo control bar (`.pd-bar`), which the real portal does not render.
- Sort is fixed: `api/_portal-db.js` orders `updated_at.desc`, then the page buckets by stage. Column headers are not buttons. There is no sort control. (KO removed its sort on purpose. This portal never had a user-facing one.)
- Empty stages are omitted, so the page is only as long as the work. A partner with deals in many stages still scrolls several tables, each with its own header.

### 2. Referral tracking defaults — Partial

Asked: Date, Customer, Stock No., Vehicle/Asset, Finance Amount, Status, Last Update, Action. Stock/vehicle prominent. Search by name, stock, vehicle, rego, ID.

What the sheet shows (`PortalRow` / `PortalGroup`):

| Asked | On the sheet | Where it actually lives |
|---|---|---|
| Date | No column | `portal_deals.created_at` is returned by the API and not rendered |
| Customer | Yes | `customer_name`, plus phone in its own column |
| Stock No. | No | No column in `DEAL_COLUMNS` |
| Vehicle / asset | Partial | Free-text `subject`, styled as the large first cell (`.board-vehicle`). Label comes from `item_label` (seeded “Buyer / property”) |
| Finance amount | No | Could be typed into `subject_details` (max 4 lines, 60 chars each). Not a number, not a column |
| Status | Yes | `status`, dropdown for staff, badge for partners |
| Last update | No column | Inside the opened row: “Last updated: …”. The latest note also shows a time |
| Action | No column | Edit, archive, and the note box sit inside the opened row |

Search (`visible` in `PortalPage`) matches `subject`, `customer_name`, `customer_mobile`, `customer_email`, and `subject_details`. Placeholder: “Name, phone, address…”. It does not search stock, rego, or deal id, because those fields do not exist. Deal `id` is not in the search list.

### 3. Vehicle / stock linking — Missing

- No stock number, rego, listing URL, or “View Stock” anywhere under `page-portal.jsx` or `api/_portal*`.
- The only link on a row is `tel:` on the mobile (`portalTel`).
- Editing a deal rewrites `subject`, `subject_details`, customer fields, partner, and status together (`PortalDealForm`, `handlePatch` in `api/_portal-routes/deals.js`). There is no way to change a stock reference while leaving a finance amount alone, because neither field exists.
- A referral with no stock is possible only because stock is not required. `subject` is required free text. There is no explicit “no stock yet” state.
- Partner onboarding (`PortalPartnerForm`) collects name, kind, contact, email, and a colour. There is no stock-URL pattern, yard site, or listing template.

KO does have stock, rego, and listing lookup. That code is `api/_ko-vehicle.js` and the dealer invoice form. It is not connected to `portal_deals`.

### 4. Fast referral submit — Partial

Staff path, one modal, “Add a referral”:

- Fields: headline, up to four detail lines, customer name, mobile, email, stage, referred-by, optional opening note.
- Validation (`validateDealInput`): headline and name required; mobile or email required; Australian mobile; email format; stage must be on the org list.
- Saving closes the modal and reloads the board. There is no separate “we’ve got it” confirmation.
- Nothing checks for an existing customer, phone, or email. `portal_deals` has no unique constraint on those columns.

Partner path: the button is rendered only when `canWrite` is true. `POST /api/portal?action=deals` uses `requirePortalWriter`, which returns 403 for a partner session (“Your account has view-only access.”). A partner cannot lodge a referral in under 60 seconds, or at all.

Vehicle, stock number, listing URL, and price are not on the form.

### 5. Statuses and what a partner can see — Partial

Asked pipeline: New → Contact Attempted → Contacted → App in Progress → Submitted → Conditional → Approved → Settled, plus On Hold, Declined, Withdrawn, LNTCB.

The database does not hard-code that list. `portal_orgs.stages` is a text array. A trigger (`portal_deals_check_status`) rejects any other value. The app checks the same list before the round trip.

The list that ships in the migration is the Ready Finance home-loan list, including Fact Find Booked, Pre-Approval Submitted, Valuation Ordered, Unconditional, Fell Through. It does not include Contact Attempted, App in Progress, Conditional, Declined, Withdrawn, or LNTCB.

`portalTone()` colours a stage from its words (declined / fell through / withdrawn / settled / approved / hold / “New …”). An unrecognised name, including LNTCB, falls through to the in-progress blue. The written name still shows.

Notes:

- Staff can tick “Keep this one internal”. `visibility = 'internal'` is stripped in the partner query (`dealsPath` adds `portal_deal_notes.visibility=eq.all`), not hidden in the browser.
- A partner note is forced to `visibility = 'all'` in `insertNote` and again by trigger `portal_notes_check_author`.
- Notes are insert-only. No edit or delete helper.
- There are no lender, risk, credit-file, or document columns, so those cannot leak as fields. A staff member can still type them into a note left on “all”. The internal tick is the only control.

Partners see customer name, mobile, email, the headline, detail lines, status, and non-internal notes. That is the right customer contact set for a referrer. It is more than a stock-and-status board.

The header tells a partner they are “view only” (`page-portal.jsx`) while the same page lets them send a message. The server allows the message. The label is wrong.

### 6. Detail that keeps the table — Partial

Opening a row toggles `openIds` and renders `board-detail-row` under that row: last updated, email, referrer (staff only), history, note box, and for staff Edit and Remove. Search text, partner filter, archived view, and which groups are collapsed stay in React state.

Edit is a centred modal (`.deal-modal`), not a side panel. The board underneath is not unmounted, so the table state survives. A side panel that leaves the sheet fully visible does not exist.

### 7. Partner onboarding — Partial

What staff can do today, from “Referral partners” (`PortalPartnersPanel`, `api/_portal-routes/partners.js`):

1. **Create** — name, kind, contact, email, colour. Server mints a code (`generateAccessCode`, 3×4 from a 30-character alphabet) and returns it once.
2. **Invite** — the UI shows the code and a plain-text message the staff member copies. The form says nothing is emailed from here.
3. **Activate** — there is no separate activate step. The code works immediately. “Switch off” sets `active = false`, and the next request from that firm is refused (`getPartnerBySlug` / `getPartnerByCode` require `active`).
4. **Refer** — still a staff action. The partner signs in and watches.

Staff logins and the owner login are not created in this screen. They are env vars in `api/_portal-config.js` and need a deploy to add a person. There is no per-person permission inside a firm: one shared code per referral partner.

Owner and staff only. A partner session gets 403 on `/api/portal?action=partners` via `requirePortalWriter`. The session payload sends partners an empty partner list so they cannot see who else refers.

### 8. Security — Present

What is in place:

- Unauthenticated `GET /api/portal?action=deals`, `partners`, and `notes` returned **401** `Please sign in again.` on production.
- An incorrect password on `ready-finance` returned **401** `Incorrect password or access code.` An unknown org returned **404** `Unknown portal.`
- Org id on every query comes from the signed cookie, not from the request (`api/_portal-routes/deals.js` header).
- Partner deals use `listDealsForPartner` (`partner_id` filter). A deal for another firm is “not found”, including when that firm tries to post a note.
- Partner list is not served signed-out and not served to a partner (`api/_portal-routes/session.js`).
- `access_code_hash` is never selected into a client payload (`PARTNER_COLUMNS` vs `PARTNER_ADMIN_COLUMNS`; `toClient` lists fields by name).
- RLS deny-all plus grants revoked from `anon` and `authenticated`.
- Responses send `Cache-Control: private, no-store` (confirmed on the live session and deals calls).
- Login compares env passwords in constant time and does not say which role almost matched.
- In-memory throttle: 10 attempts per 10 minutes per IP per serverless instance (`api/_portal-routes/login.js`). The file says this is a speed bump. The real bar is the generated code (~58 bits).
- `/portal/:slug` sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` (confirmed on `/portal/ready-finance`). `robots.txt` disallows `/portal/`. The page also swaps the robots meta to noindex while mounted.

Residual items are listed under risks. They do not erase the isolation model. They do mean it should not be treated as finished hardening.

### 9. Dashboard — Partial

There is no KPI row and no chart library on `PortalPage`.

What a signed-in user sees instead:

- A scope sentence: deal count, and for staff the partner count.
- A count badge on each stage group.
- Active vs Removed.

The five work queues in the brief (Active, Awaiting Contact, In Progress, Approved, Settled) are not computed. Stage groups are the closest thing, and they only appear once a deal is in that stage.

This matches the “no decorative charts” part of the brief. It does not yet give a partner a one-glance work list.

### 10. Internal admin across partners — Partial

On the one configured org, staff and the owner see every partner’s deals, filter by partner, and open the partner admin panel (rename, recolour, new code, switch off, delete only when `deal_count` is 0). Delete of a firm that has deals returns 409, because `partner_id` is `ON DELETE SET NULL` and a delete would silently unattribute them.

There is no page that lists every brokerage. `/portal` says the portal is not available. The owner password works only for slugs in `PORTAL_LOGINS`, which is only `ready-finance`. A second brokerage is not “a database row” by itself: `login.js` rejects the slug before it reads `portal_orgs` unless the slug is in that file.

The portal does not reimplement KO stock lookup, invoice request, salesperson roster, or the `deals` table. Those remain the KO board. The overlap is visual (shared board CSS) and operational (both products live under this domain’s API, and they share `DEALER_SESSION_SECRET`).

### 11. Branding, accessibility, fluff — Partial

- Real portal: no marketing nav. Accent and logo come from `portal_orgs`. Live values are Ready Finance blue `#1681B7` and `/assets/ready-finance-logo.png`.
- Bare `/portal` is the Buyer Assist HTML shell until JavaScript runs, then the sentence “This portal is not available.” The static `<title>` and robots meta stay the public site’s until that script runs. The edge header `X-Robots-Tag` is set for `/portal/(.*)` only, not for exact `/portal`. `robots.txt` disallows `/portal/` (with the slash), which does not cover the exact path `/portal`.
- Copy is plain: “Add a referral”, “Referral partners”, “Sign in”. No pricing, no charts, no viewer switcher. Those belong to the demos.
- Footer credits BrokenMind Software and states data is held in Australia.
- Accessibility that is present: labelled inputs, `role="alert"` on errors, `aria-expanded` on rows and groups, `role="dialog"` on modals, 16px inputs (avoids iOS zoom), focus outlines on board controls, status always written as well as coloured, phone cells expose a label on small screens.
- Gaps: colour swatches are labelled with the hex code; no focus trap was found on the modals; the partner header says “view only” while messaging is allowed; times use the device timezone (`portalWhen`), while the KO board pins `Australia/Brisbane`.

For a Buyer Assist partner launch, the board would still look like the org row. There is no Buyer Assist org row.

### 12. Pre-launch testing gaps — Missing

Repo has no `*.test.*` / `*.spec.*` files. README’s pre-launch checklist does not mention `/portal`. README’s file map omits `page-portal.jsx` and `api/portal.js`.

Not exercised in this audit, because it would need a real sign-in or a production write:

- Owner, staff, and partner login with real credentials
- Two partners on one org, each proving they cannot read the other’s deals or notes
- Create, edit, restage, note, internal note, archive, restore
- Partner message on their own deal, and a 404 on someone else’s id
- Switch a partner off and confirm the next poll dies
- Empty board, error banner, expired 12-hour session
- Phone layout with real rows
- Duplicate customer submit
- Re-running the SQL against a board that already has real stages (the first migration’s `ON CONFLICT DO UPDATE` overwrites `stages`)

Code review covers the intended behaviour of those paths. That is not a test pass.

### 13. Technical risks — Partial

Documented in the repo already:

- Portal tables are separate from KO `deals` so a home-loan shape cannot drop the vehicle NOT NULLs on the dealership board (header of `supabase/2026-08-11-create-referral-portal.sql`).
- Service-role key bypasses RLS. Scoping in `api/_portal-db.js` is the boundary.
- `api/portal.js` exists because a Vercel Hobby deployment was already at the 12-function cap. Handlers live in `api/_portal-routes/` so they are not extra functions. Current deployable entry files under `api/` (names not starting with `_`, and not inside an `_` directory) are nine: five `api/dealer/*`, `api/lead.js`, `api/debt-busters-outcome.js`, `api/staff-auth.js`, `api/portal.js`.

Still open:

1. **Wrong product for this launch.** The live org, labels, stages, and staff roster are Ready Finance. Login refuses any other slug.
2. **Manual SQL.** Migrations are files to paste into the Supabase SQL editor. Nothing in the repo applies them. Re-running the first file resets Ready Finance’s stage list and reinserts the four placeholder partners.
3. **Legacy partner passwords.** `PORTAL_LOGINS['ready-finance'].partners` still names four demo firms and env vars `RF_PORTAL_*_PASSWORD`. Those env vars work until that firm has an `access_code_hash`. This audit did not read Vercel env.
4. **Shared session secret** with the dealer board. Surface markers stop cross-login. Rotating `DEALER_SESSION_SECRET` signs everyone out of both.
5. **KO API still on this domain** after the page moved to brokenmind.com.au. Signed-out session returns the KO status list. Deals stay behind 401. Two boards, two mental models, one secret.
6. **Rate limit is per instance**, not a shared store.
7. **Access codes are SHA-256**, not a slow hash. The code comments explain why (generated entropy, indexed lookup). Worth knowing if anyone later lets a partner choose their own password.
8. **Exact `/portal` is easier to index** than `/portal/:slug` (see §11). The page has no customer data.
9. **Partner-visible free text.** Internal notes work. There is no structured block that cannot be shown to a partner.
10. **Hobby function cap** is no longer tight (nine of twelve) but the comment in `api/portal.js` is why new portal routes must stay on `?action=`.

### 14. Overall readiness — Partial

| Question | Answer |
|---|---|
| Does a real, logged-in, database-backed portal exist at thebuyerassist.com.au? | Yes. `/portal/ready-finance`. |
| Is that the Buyer Assist partner experience in this brief? | No. It is a Ready Finance referral board: property headline, applicant, phone, note, stage. |
| Can a partner land, find a customer and a stock number, and act, with no training? | They can sign in and read the deals attributed to them, open the history, and send a message. They cannot see stock, lodge a referral, or scan the columns this brief names. |
| Safe to launch to BAG referral partners this week? | No. |

The Ready Finance portal can stay up. Turning this on for Buyer Assist partners would teach them a home-loan board and would not track stock.

---

## Top risks and blockers for a BAG launch

1. **No Buyer Assist portal org.** Code and production both know only `ready-finance`. A BAG slug cannot sign in.
2. **Deal shape has no stock, vehicle, listing, or amount.** The sheet cannot show the columns the brief treats as the job.
3. **Partners cannot submit a referral.** Create is staff-only on the server.
4. **Stage list is the Ready Finance home-loan pipeline**, not New → … → Settled plus On Hold / Declined / Withdrawn / LNTCB.
5. **Onboarding stops at a copied access code.** No email send, and after activate there is nothing for the partner to lodge.
6. **No signed-in test evidence** for isolation, CRUD, mobile, or empty states.
7. **Two boards on one domain.** Portal tables are separate from KO (good). The KO API still answers here, and both cookies share one secret (operational hazard, not a data mix).

---

## Suggested focus for Stage 2

Out of scope for this run. Not a build plan.

- Add a Buyer Assist org only after the deal fields exist, so partners never learn the Ready Finance column set.
- Put stock number, vehicle, listing link, finance amount, date, last update, and a clear action on the sheet. Keep it one list, stage colour, no charts.
- Let the partner submit the short form (name, phone, email, vehicle, stock, URL, price, notes), show a confirmation, and block an obvious duplicate.
- Allow stock to be corrected without rewriting the finance figures. Allow a referral that has no stock yet.
- Set the BAG stage list, including On Hold, Declined, Withdrawn, and LNTCB. Keep internal notes off the partner payload.
- Deliver the access code without asking staff to copy it by hand, then the partner’s first job is to refer.
- Run a signed-in pass with two partners before anyone external is invited.
- Leave the KO Cars board and its invoice / stock lookup where they are.

---

## How this was checked

Read: `page-portal.jsx`, `page-portal-demo.jsx` (enough to separate it), `app.jsx` routes, `api/portal.js`, `api/_portal-config.js`, `api/_portal-session.js`, `api/_portal-db.js`, `api/_portal-codes.js`, `api/_portal-routes/{login,logout,session,deals,notes,partners}.js`, both portal SQL files, `styles.css` board rules, `vercel.json`, `robots.txt`, `index.html` script tags, and the KO reference page plus its public `page-dealer.jsx` column headers.

Live, signed out:

- `GET /portal` → 200 HTML, no `X-Robots-Tag`, body is the site shell; after script, “This portal is not available.”
- `GET /portal/ready-finance` → 200, `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- `GET /api/portal?action=session&org=ready-finance` → 200, `authenticated: false`, Ready Finance branding only.
- `GET /api/portal?action=session&org=buyer-assist` → `org: null`.
- `GET /api/portal?action=deals` → 401.
- `POST /api/portal?action=login` with a dummy password → 401 on `ready-finance`, 404 on an unknown org.
- `GET /dealer/ko-cars` → 308 to https://brokenmind.com.au/ko.
- `GET /api/dealer/session` → 200, signed out, KO status list. `GET /api/dealer/deals` → 401.

No product file was changed for this audit.
