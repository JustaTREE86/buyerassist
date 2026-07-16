# Debt Busters Outcome Form, Handoff to Leonie

This is everything needed to own and run the Debt Busters referral outcome form end to end. Most of the stack is already in the Cullen Financial / Buyer Assist accounts. The only piece currently tied to Josh is the Vercel deployment.

## What the system does

1. Debt Busters staff open the hidden page `/staff/debt-busters`, enter the shared password, and fill in the referral outcome.
2. The website's backend validates the submission (password, required fields) server-side.
3. It POSTs the outcome to a Make.com webhook.
4. Make creates or updates the client's GoHighLevel contact (so the data is retained in the CRM), logs the full outcome as a note, and tags the contact `db-outcome-dead`.
5. A GoHighLevel workflow, triggered by that tag, emails the outcome to Debt Busters plus an internal copy.

## What is already in Cullen Financial / Buyer Assist accounts

- **Make automation** lives in the Make account (scenario "Debt Busters Outcome, GHL + Email", id 6559562, created under connect@thebuyerassist.com.au).
- **GoHighLevel** is the Cullen Financial CRM. The contact, note, tag, and outcome email all happen here.

Nothing about these two needs to move. They are already yours.

## The one piece to take ownership of: the Vercel deployment

The website (and its form backend) runs on Vercel. It is currently under Josh's Vercel account. To own it:

1. **Create a free Vercel account** at vercel.com (hobby tier is enough for this traffic, no cost).
2. **Josh transfers the project** to you: Vercel dashboard, Project, Settings, Transfer. Everything moves with it.
3. **Set the two environment variables** (Project, Settings, Environment Variables):
   - `DEBT_BUSTERS_STAFF_PASSWORD` = the shared password staff type at `/staff/debt-busters`
   - `MAKE_WEBHOOK_URL` = `https://hook.eu1.make.com/qnaedkkimasm9t2x437qwr7taclw4bth`
4. **Redeploy** after setting the variables so they take effect.

## Pointing your domain at it

To run this on your domain (for example `thebuyerassist.com.au`), in Vercel add the domain under Project, Settings, Domains, then set these records at your registrar (GoDaddy):

- Apex `@`: A record to the IP Vercel shows you (currently `76.76.21.21`)
- `www`: CNAME to `cname.vercel-dns.com`

Important: **do not switch your nameservers to Vercel, and do not touch any MX or TXT records.** Changing nameservers or MX records would break email on the domain (connect@thebuyerassist.com.au). Only edit the two records above.

SSL is issued automatically. The site is usually live within an hour of the DNS change.

## Making changes later

The website source currently lives in Josh's OneDrive and is deployed with the Vercel CLI. To update the site yourself in future without depending on Josh, the clean setup is to put the `Website/` folder into a GitHub repository and connect that repo to your Vercel project. After that, every change pushed to GitHub deploys automatically.

## Reference

| Item | Value |
|---|---|
| Hidden staff page | `/staff/debt-busters` |
| Make webhook | `https://hook.eu1.make.com/qnaedkkimasm9t2x437qwr7taclw4bth` |
| Make scenario | "Debt Busters Outcome, GHL + Email", id 6559562 |
| GHL contact tag that fires the email | `db-outcome-dead` |
| Env vars needed in Vercel | `DEBT_BUSTERS_STAFF_PASSWORD`, `MAKE_WEBHOOK_URL` |
