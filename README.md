# The Buyer Assist Group — Website Pitch

A boutique premium-finance website concept pitched to The Buyer Assist Group.
Concept by **Broken Mind Software**.

## What's in here

A fully static, single-page React prototype with four navigable views:

- **Home** — Cinematic portrait hero, 7 loan products, rate calculator, 4-step process, lender wall, founder editorial block.
- **Loan Products** — Full services index with process detail.
- **About** — Founder story (Leonie), values, team, numbers.
- **Apply** — Multi-step pre-approval form.

Plus a Tweaks panel (bottom-right toggle in preview) that lets you live-swap:
- Logo direction (Existing vs Proposed)
- Color palette (Navy & Gold / Forest & Brass / Espresso & Copper / Ink & Champagne)
- Hero layout (Portrait / Cinematic / Split / Editorial)

## Run locally

It's pure static HTML — no build step. Just serve the folder:

```bash
# Option A: Python
python3 -m http.server 8000

# Option B: Node
npx serve .
```

Then open `http://localhost:8000`.

## Deploy to Vercel

1. Push this folder to a new GitHub repo (see below).
2. In Vercel: **Add New → Project → Import** that repo.
3. Framework Preset: **Other** (or "No framework").
4. Build Command: *leave empty.*
5. Output Directory: *leave empty* (uses repo root).
6. Click **Deploy**.

No environment variables needed.

## File map

| File | Purpose |
|---|---|
| `index.html` | App shell — fonts, React/Babel CDN scripts |
| `styles.css` | All styles (design tokens at top) |
| `components.jsx` | Photos, loan data, icons, logos, formatters |
| `page-home.jsx` | Hero (4 variants), Products, Calculator, Process, Lenders, Bespoke/Leonie block, Pillars, Feature, CTA |
| `page-inner.jsx` | Services, About, Apply pages |
| `app.jsx` | Router + Nav + Footer + Tweaks |
| `tweaks-panel.jsx` | Tweaks UI scaffolding |
| `photos/leonie.avif` | Principal Broker portrait |

## Notes for the client

- All other team portraits and the credit-repair imagery are placeholders — swap with real photography before launch.
- The "proposed" logo mark is directional — a finished mark should be commissioned separately.
- Lender names in the marquee are a representative sample; supply your live panel list to replace.
