# The Buyer Assist Group — Website

Production-ready website for **The Buyer Assist Group** (Cullen Financial Services Pty Ltd).
Built by **BrokenMind Software**.

---

## Business Details (applied throughout)

| Field | Value |
|---|---|
| Trading name | The Buyer Assist Group |
| Legal entity | Cullen Financial Services Pty Ltd |
| ACN | 680 292 399 |
| ACR (Credit Rep.) | 564 090 |
| AFCA | 111126 |
| FBAA | M-358724 |
| Director | Leonie Cullen |
| Phone | 07 5613 1905 |
| Email | connect@thebuyerassist.com.au |
| Website | www.thebuyerassist.com.au |
| Office | WOTSO, 395 Hamilton Rd, Chermside QLD 4032 |
| Credit Licence | ACL 414426, held by AFAS Group Pty Ltd (ABN 12 134 138 686) |

---

## Pages

- **Home** (`/`) — Leonie portrait hero, 7 loan products, rate calculator, 4-step process, lender marquee, founder editorial block, pillars, CTA
- **Loan Products** (`/loan-products`) — Full services index with per-product detail
- **About** (`/about`) — Leonie's story, values, credentials, team, links to individual broker profiles
- **Team profile** (`/team/:id`) — Individual broker bio
- **Our Partners** (`/partners`) — Ready Finance, Debt Busters, Wipe Credit Clean, plus a "become a referral partner" form
- **Credit Repair** (`/credit-repair`) + **Credit Repair Enquiry** (`/credit-repair/enquiry`) — separate from a finance application, no guaranteed-outcome wording
- **Our Clients** (`/our-clients`) — testimonials + Google reviews widget
- **Apply** (`/apply`) — Loan-type picker, full-bleed (no nav/footer); each option links straight to its AFOS quick-quote page
- **Privacy & Credit Guide** (`/privacy`) — NCCP disclosures, lender schedule
- **Staff — Debt Busters outcome** (`/staff/debt-busters`) — **hidden**, password-gated, not linked from nav/footer/sitemap. See "Hidden staff page" below.
- **Josh's quick quote** (`/autozone-apply`) — **hidden**, not linked from nav/footer/sitemap. Full-bleed embed of Josh's personal AFOS referral widget (`page-autozone.jsx`) — a link he sends directly to clients.

All pages are real, deep-linkable URLs (browser back/forward and page refresh both work) — routing lives in `app.jsx` (`ROUTES` / `pathFor` / `parsePath`).

The Tweaks panel (bottom-right toggle) lets you swap colour palette and hero layout during client review.

---

## Run Locally (preview)

No build step — pure static files:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Open `http://localhost:8000`

---

## Deploy to Vercel (go live)

1. Push this `Website/` folder to a new GitHub repo
2. Vercel → **Add New → Project → Import** that repo
3. Framework Preset: **Other**
4. Build Command: *(leave empty)*
5. Output Directory: *(leave empty)*
6. Set the environment variables in `.env.example` under Project → Settings → Environment Variables
7. **Deploy** → then point `www.thebuyerassist.com.au` DNS to Vercel

---

## Environment variables

See `.env.example` for the full list with descriptions. Required for the hidden
staff page (`/staff/debt-busters`) to work:

| Variable | Purpose |
|---|---|
| `DEBT_BUSTERS_STAFF_PASSWORD` | Password staff enter to access the hidden page |
| `MAKE_WEBHOOK_URL` | Make.com webhook the outcome is POSTed to. Make creates/updates the GoHighLevel contact, logs the outcome as a note, and tags it so a GHL workflow emails Debt Busters + an internal copy. Current URL: `https://hook.eu1.make.com/qnaedkkimasm9t2x437qwr7taclw4bth` |

Without these set, `/staff/debt-busters` still loads and rejects logins with a clear
"not configured yet" error rather than failing silently.

---

## Pre-Launch Checklist

- [ ] Swap placeholder Unsplash images with real/licensed photography
- [ ] Replace lender marquee with Leonie's confirmed live panel
- [ ] Add Google Analytics 4 tag to `index.html`
- [ ] Set `DEBT_BUSTERS_STAFF_PASSWORD` and `MAKE_WEBHOOK_URL` in Vercel before relying on `/staff/debt-busters`
- [ ] Activate the Make scenario "Debt Busters Outcome, GHL + Email" (id 6559562) and build the GHL workflow that emails Debt Busters + internal copy off the `db-outcome-dead` tag
- [x] Every loan-type CTA (`/apply`, product cards, Nav dropdown, calculator) links straight to its AFOS quick-quote page (`AFOS_LINKS` / `afosLink()` in `components.jsx`) — no form, no email relay
- [x] Credit Repair Enquiry and "become a referral partner" still post through `CONTACT.formEndpoint` (`/api/lead`) → Make → GoHighLevel
- [x] Privacy Policy / Credit Guide page live at `/privacy`
- [x] Debt Busters added to the Our Partners section with compliant, no-guarantee wording
- [ ] Confirm the licensee address on `/privacy` (Bundall QLD 4217) against the office address in the footer (WOTSO, Chermside QLD 4032) — these currently disagree and only Josh/Leonie can confirm which is correct

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | Shell — fonts, React/Babel CDN, meta/OG tags. All script/asset URLs are root-absolute (`/styles.css`, `/assets/...`) — keep them that way, or nested routes like `/credit-repair/enquiry` will 404 on every asset. |
| `styles.css` | All styles + design tokens |
| `components.jsx` | Photos, loan data, icons, logos, formatters, contact details |
| `page-home.jsx` | Hero, Products, Calculator, Process, Lenders, Bespoke block, Pillars, CTA |
| `page-inner.jsx` | Services, About, Apply, Broker profile, Credit repair, Partners pages |
| `page-clients.jsx` | Our Clients — testimonials + reviews widget |
| `page-privacy.jsx` | Privacy & Credit Guide |
| `page-staff.jsx` | Hidden `/staff/debt-busters` page — password gate + outcome form |
| `page-autozone.jsx` | Hidden `/autozone-apply` page — full-bleed embed of Josh's personal AFOS referral widget |
| `app.jsx` | Router (`ROUTES`/`pathFor`/`parsePath`), Nav, Footer, top-level `App` |
| `tweaks-panel.jsx` | Client design tweaks panel (only opens when driven by an external host — no visible toggle in production) |
| `api/staff-auth.js` | Serverless — checks the staff password |
| `api/debt-busters-outcome.js` | Serverless — validates the outcome form and POSTs it to the Make webhook (`MAKE_WEBHOOK_URL`), which drives GHL contact + note + email |
| `api/_util.js` | Shared helpers for the two functions above (not its own route — Vercel skips `_`-prefixed files) |
| `robots.txt` | Blocks `/staff/` from indexing; everything else is `Allow` |
| `assets/leonie.avif` | Leonie — Director portrait |
