/* global React, BrandLogo */
// =============================================================
// Hidden AutoZone staff ad-copy tool — /autozone-staff
//
// NOT the customer page. /autozone-apply is the customer quote widget;
// THIS page is an internal reference AutoZone QLD staff open to grab
// ready-made, compliant Facebook ad copy for each vehicle price point.
//
// Hidden like the other staff pages: no nav link, no footer link, no
// sitemap entry, blocked from indexing (robots.txt + vercel.json
// X-Robots-Tag + the noindex meta swap below). Fully self-contained —
// nothing is collected or posted from this page.
//
// Numbers are computed live from the locked AutoZone offer:
//   fixed 11.95% p.a., 60-month term, $550 establishment + $1,210
//   brokerage financed into the loan, no monthly fees. Weekly repayment
//   = amortised monthly repayment x 12 / 52 on (price + $1,760).
// If the offer changes, edit RATE / TERM / ESTAB / BROK below.
// =============================================================
const { useEffect: useEffectAZS, useState: useStateAZS, useMemo: useMemoAZS } = React;

const AZS = { RATE: 0.1195, TERM: 60, ESTAB: 550, BROK: 1210, MIN: 9990, MAX: 99990, STEP: 1000 };

function useAutozoneStaffNoIndex() {
  useEffectAZS(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

function azsCaption(weekly) {
  // Full https:// URL on its own line so Facebook auto-links it (post text
  // can't carry real HTML anchors — a clean URL is what makes it clickable).
  return 'From $' + weekly + ' per week.\n'
    + 'APPLY NOW 👉\n'
    + 'https://www.thebuyerassist.com.au/autozone-apply\n'
    + 'To Approved Purchasers (T.A.P). Fees, T&Cs and lending criteria apply.';
}

function AutozoneStaffPage() {
  useAutozoneStaffNoIndex();

  const rows = useMemoAZS(() => {
    const r = AZS.RATE / 12, out = [];
    for (let p = AZS.MIN; p <= AZS.MAX; p += AZS.STEP) {
      const af = p + AZS.ESTAB + AZS.BROK;
      const monthly = af * r / (1 - Math.pow(1 + r, -AZS.TERM));
      out.push({ price: p, weekly: monthly * 12 / 52 });
    }
    return out;
  }, []);

  const [q, setQ] = useStateAZS('');
  const [copied, setCopied] = useStateAZS(null);

  const digits = q.replace(/[^0-9]/g, '');
  const filtered = digits ? rows.filter(r => String(r.price).indexOf(digits) > -1) : rows;

  const copyRow = (row) => {
    const text = azsCaption(row.weekly.toFixed(2));
    const done = () => { setCopied(row.price); setTimeout(() => setCopied(c => (c === row.price ? null : c)), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => { azsFallbackCopy(text); done(); });
    } else { azsFallbackCopy(text); done(); }
  };

  return (
    <main className="azs" data-screen-label="AutoZone — Staff ad copy">
      <style>{AZS_CSS}</style>

      <header className="azs-head">
        <div className="azs-brand">
          <BrandLogo light={false} size="sm" />
          <div>
            <div className="azs-eyebrow">AutoZone QLD · Staff use</div>
            <h1 className="azs-title">Weekly repayment ad copy</h1>
          </div>
        </div>
        <div className="azs-apply">
          <span className="azs-apply-l">Apply link</span>
          <span className="azs-apply-u">thebuyerassist.com.au/autozone-apply</span>
        </div>
      </header>

      <p className="azs-how">
        <b>How to use:</b> find the car's price, hit <b>Copy ad text</b>, paste straight into your Facebook post.
        The weekly repayment is the headline; the rate stays in the fine print below. Internal reference only — not a quote or an offer of finance.
      </p>

      <input
        className="azs-filter"
        type="text"
        inputMode="numeric"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Filter by price, e.g. 24990"
        aria-label="Filter by vehicle price"
      />

      <div className="azs-list">
        {filtered.map(row => {
          const isCopied = copied === row.price;
          return (
            <div className={'azs-row' + (row.price === 19990 ? ' azs-hl' : '')} key={row.price}>
              <div className="azs-rp">
                <span className="azs-rlabel">Vehicle price</span>
                <span className="azs-rprice">${row.price.toLocaleString()}</span>
              </div>
              <div className="azs-rw">
                <span className="azs-rwbig">${row.weekly.toFixed(2)}</span>
                <span className="azs-rwunit">/week</span>
              </div>
              <button
                type="button"
                className={'azs-copy' + (isCopied ? ' done' : '')}
                onClick={() => copyRow(row)}
              >
                {isCopied ? 'Copied ✓' : 'Copy ad text'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="azs-nomatch">No price point matches that. Try another number.</div>
        )}
      </div>

      <div className="azs-fine">
        <h2>Fine print / advertising disclaimer</h2>
        <p>
          Weekly repayments shown are estimates for illustration only and are not a quote or an offer of finance.
          Based on a fixed rate of <b>11.95% p.a.</b> over a 60-month term, with a $550 establishment fee and
          $1,210 brokerage financed into the loan and no monthly account-keeping fees. Repayments are calculated on
          the amount financed (vehicle price + $1,760) and equal the monthly repayment &times; 12 &divide; 52.
          Example: a $19,990 vehicle, amount financed $21,750, repays <b>$111.52 per week</b>. Finance is available
          to approved purchasers only (T.A.P). Actual rate, fees and repayments depend on the lender, the vehicle,
          your credit assessment and circumstances. Terms, conditions, fees and lending criteria apply.
        </p>
        <p>
          <b>Comparison rate:</b> <b>14.49% p.a.</b> based on a $30,000 loan over 5 years.
          <span className="azs-flag"> [VERIFY with licensee before publishing] </span>
          WARNING: This comparison rate is true only for the example given and may not include all fees and charges.
          Different terms, fees or loan amounts might result in a different comparison rate. Costs such as early
          repayment fees, and cost savings such as fee waivers, are not included in the comparison rate but may
          influence the cost of the loan.
        </p>
        <p>
          <b>Cullen Financial Services Pty Ltd T/As The Buyer Assist Group</b>, ACN 680 292 399, is Authorised Credit
          Representative <b>564090</b> of Australian Credit Licence <b>414426</b> (AFAS Group Pty Ltd, ABN 12 134 138 686).
          Member AFCA 111126, FBAA M-358724.
        </p>
        <p className="azs-flag">
          Facebook captions carry the apply link only. The full disclaimer above, including the comparison rate warning,
          must appear on the /autozone-apply landing page so every ad points to compliant fine print.
        </p>
      </div>
    </main>
  );
}

function azsFallbackCopy(text) {
  const a = document.createElement('textarea');
  a.value = text; a.style.position = 'fixed'; a.style.opacity = '0';
  document.body.appendChild(a); a.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(a);
}

const AZS_CSS = `
.azs{ max-width:820px; margin:0 auto; padding:36px 22px 56px;
  background:var(--paper); color:var(--ink); min-height:100vh;
  font-family:'Manrope',system-ui,sans-serif; }
.azs *{ box-sizing:border-box; }
.azs-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:20px;
  flex-wrap:wrap; border-bottom:2px solid var(--ink); padding-bottom:18px; }
.azs-brand{ display:flex; align-items:center; gap:14px; }
.azs-eyebrow{ font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--gold-2); font-weight:700; }
.azs-title{ font-family:'Newsreader',Georgia,serif; font-weight:500; font-size:27px;
  line-height:1.1; margin:3px 0 0; letter-spacing:-.01em; }
.azs-apply{ text-align:right; display:flex; flex-direction:column; }
.azs-apply-l{ font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:600; }
.azs-apply-u{ font-size:15px; font-weight:700; margin-top:3px; color:var(--gold-2); }
.azs-how{ background:var(--bone); border:1px solid var(--line); border-radius:12px;
  padding:13px 17px; margin:18px 0; font-size:13.5px; line-height:1.55; color:var(--ink);
  opacity:.92; }
.azs-filter{ width:100%; margin:2px 0 16px; padding:12px 15px; font-size:15px;
  font-family:inherit; border:1.5px solid var(--line); border-radius:10px;
  background:var(--bone); color:var(--ink); }
.azs-filter:focus{ outline:2px solid var(--gold); outline-offset:1px; border-color:var(--gold); }
.azs-filter::placeholder{ color:var(--muted); }
.azs-list{ display:flex; flex-direction:column; gap:8px; }
.azs-row{ display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:14px;
  background:var(--bone); border:1px solid var(--line); border-radius:11px; padding:11px 15px; }
.azs-hl{ background:var(--cream); border-color:var(--gold-soft); }
.azs-rp{ display:flex; flex-direction:column; }
.azs-rlabel{ font-size:10px; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); font-weight:700; }
.azs-rprice{ font-size:15px; font-weight:700; margin-top:2px; }
.azs-rw{ display:flex; align-items:baseline; gap:4px; justify-self:end; }
.azs-rwbig{ font-family:'Newsreader',Georgia,serif; font-size:28px; font-weight:500;
  color:var(--gold-2); line-height:1; font-variant-numeric:tabular-nums; }
.azs-rwunit{ font-size:12px; font-weight:600; color:var(--muted); }
.azs-copy{ background:var(--ink); color:var(--cream); border:none; border-radius:8px;
  padding:10px 15px; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap;
  font-family:inherit; transition:opacity .15s, background .15s; }
.azs-copy:hover{ opacity:.88; }
.azs-copy:focus-visible{ outline:2px solid var(--gold); outline-offset:2px; }
.azs-copy.done{ background:#1E7A46; color:#fff; }
.azs-nomatch{ color:var(--muted); font-size:14px; padding:18px 4px; }
.azs-fine{ margin-top:30px; padding-top:18px; border-top:1px solid var(--line);
  font-size:11px; line-height:1.6; color:var(--muted); }
.azs-fine h2{ font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink);
  opacity:.75; margin:0 0 8px; font-family:'Manrope',sans-serif; }
.azs-fine p{ margin:0 0 9px; }
.azs-fine b{ color:var(--ink); }
.azs-flag{ color:#B23A2E; font-weight:700; }
@media (max-width:560px){
  .azs-row{ grid-template-columns:1fr auto; grid-template-rows:auto auto; }
  .azs-copy{ grid-column:1 / -1; width:100%; }
  .azs-apply{ text-align:left; }
  .azs-head{ }
}
@media (prefers-reduced-motion:reduce){ .azs-copy{ transition:none; } }
`;

Object.assign(window, { AutozoneStaffPage });
