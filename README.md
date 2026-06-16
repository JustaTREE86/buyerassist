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
| Phone | 0439 300 621 |
| Email | leonie@thebuyerassist.com.au |
| Website | www.thebuyerassist.com.au |
| Office | WOTSO Westfield Chermside, QLD 4032 |

---

## Pages

- **Home** — Leonie portrait hero, 7 loan products, rate calculator, 4-step process, lender marquee, founder editorial block, pillars, CTA
- **Loan Products** — Full services index with per-product detail
- **About** — Leonie's story, values, credentials, team
- **Apply** — Multi-step pre-approval form

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
6. **Deploy** → then point `www.thebuyerassist.com.au` DNS to Vercel

---

## Pre-Launch Checklist

- [ ] Swap placeholder Unsplash images with real/licensed photography
- [ ] Replace lender marquee with Leonie's confirmed live panel
- [ ] Add real Google Reviews / client testimonials
- [ ] Add Google Analytics 4 tag to `index.html`
- [ ] Confirm ACL host for disclaimer (currently: BLSSA Pty Ltd ACL 391237)
- [ ] Wire Apply form to backend (Formspree, EmailJS, or custom)
- [ ] Add a Privacy Policy page
- [ ] Confirm `leonie@thebuyerassist.com.au` inbox is live

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | Shell — fonts, React/Babel CDN, meta/OG tags |
| `styles.css` | All styles + design tokens |
| `components.jsx` | Photos, loan data, icons, logos, formatters |
| `page-home.jsx` | Hero, Products, Calculator, Process, Lenders, Bespoke block, Pillars, CTA |
| `page-inner.jsx` | Services, About, Apply pages |
| `app.jsx` | Router, Nav, Footer |
| `tweaks-panel.jsx` | Client design tweaks panel |
| `photos/leonie.avif` | Leonie — Principal Broker portrait |
