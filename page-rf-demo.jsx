/* global React */
// =============================================================
// Ready Finance Group, Referral Partner Portal demo, /portal-demo/ready-finance
//
// A branded, ready-to-present version of the generic /portal-demo, built for
// one prospect: Ready Finance Group (Ben, Director). Their logo, their blue,
// their domain, a home loan pipeline instead of an asset finance one, and
// referral partners that match how they actually get business (agents, buyers
// advocates, conveyancers, accountants).
//
// It is NOT the product and it is NOT connected to anything:
//
//   - no API calls, no Supabase, no auth, no cookies
//   - every applicant, partner, property and note below is invented
//   - all state lives in this component and resets on reload
//
// That is deliberate. A demo holding real client data would breach BrokenMind
// permanent rule 11 and drag the Privacy Act into a sales call. It also means
// nothing can fail live: no network, no cold start, no login to fumble.
//
// Phone numbers are from the ACMA range reserved for fiction (0491 570 006 to
// 0491 570 156) so nothing here can ring a real person. Emails use example.com.
// Street numbers are invented; only suburb names are real.
//
// Reuses the .deal-* / .board-* / .pd-* styles. Only the genuinely Ready
// Finance specific pieces (logo lockup, login mock) get their own .rf-* rules,
// at the end of styles.css.
// =============================================================
const {
  useState: useStateRf,
  useEffect: useEffectRf,
  useMemo: useMemoRf,
} = React;

// ---- the one thing to check before sending the link ---------------------
//
// [VERIFY with Ben] RF_DOMAIN is the address their partners would log in at.
// It is a placeholder built from their trading name, not a domain anyone has
// confirmed. Swap it for whatever Ben actually owns before the demo, it is
// used in the brand bar, the login mock and the setup steps.
const RF = {
  name: 'Ready Finance Group',
  short: 'Ready Finance',
  domain: 'partners.readyfinance.com.au',
  accent: '#1681B7',
  logo: '/assets/ready-finance-logo.png',
  logoWhite: '/assets/ready-finance-logo-white.png',
  itemLabel: 'Buyer / property',
  customerLabel: 'Applicant',
};

// ---- helpers ------------------------------------------------------------

// Seed data is written in "days ago" so the board always looks live, whether
// Josh demos it tomorrow or in six months.
function rfDaysAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function rfWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s*(am|pm)$/i, (m) => m.toUpperCase());
  return `${date}, ${time}`;
}

// Colour is never the only signal: the written stage is always rendered next
// to it. Tone is derived from the words so a new stage picks up a sensible
// colour without anyone editing a lookup table.
function rfTone(stage) {
  const s = String(stage || '').toLowerCase();
  if (/declin|fell through|withdrawn|cancel/.test(s)) return 'bad';
  if (/settled|unconditional/.test(s)) return 'done';
  if (/pre-approved|formal approval|property found/.test(s)) return 'good';
  if (/required|waiting|hold|verif|requested|chasing/.test(s)) return 'attention';
  if (/^new /.test(s)) return 'new';
  return 'progress';
}

function rfTel(mobile) {
  const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted, and restores it on unmount. Deliberately local rather than shared
// with the other hidden pages, see the note in page-dealer.jsx.
function rfNoIndex() {
  useEffectRf(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

// ---- the pipeline -------------------------------------------------------
//
// A home loan pipeline, because that is what Ready Finance writes. None of
// these stages exist on the asset finance board Josh runs for KO Cars, which
// is the point: the stages belong to the firm, not to us.

const RF_STAGES = [
  'New Referral',
  'Contacting Buyer',
  'Fact Find Booked',
  'Documents Required',
  'Pre-Approval Submitted',
  'Pre-Approved',
  'Property Found',
  'Full Application',
  'Valuation Ordered',
  'Formal Approval',
  'Unconditional',
  'Settled',
  'On Hold',
  'Fell Through',
];

// ---- their referral partners --------------------------------------------
//
// Four different kinds of referrer, because Ready Finance does not get its
// business from one channel. Each one cares about a different moment in the
// pipeline, and the notes are written to show that.

const RF_PARTNERS = [
  { id: 'coastline', name: 'Coastline Property Group', kind: 'Real estate agency', signedInAs: 'Elise', accent: '#0E6E6E' },
  { id: 'ashgrove', name: 'Ashgrove Buyers Advocacy', kind: 'Buyers advocate', signedInAs: 'Cameron', accent: '#2F6B4F' },
  { id: 'meridian', name: 'Meridian Conveyancing', kind: 'Conveyancer', signedInAs: 'Trish', accent: '#6B3A5B' },
  { id: 'pinnacle', name: 'Pinnacle Accounting Partners', kind: 'Accountant', signedInAs: 'Deepa', accent: '#2C4A6E' },
];

// Invented marks for invented firms, drawn inline so there is no asset to
// ship, nothing to 404, and they stay sharp at any size. Abstract geometry on
// purpose: these must not read as any real agency's logo. Each one is shaped
// to its trade, so the four are distinguishable at a glance on the board.
const RF_PARTNER_GLYPHS = {
  // Two waves under a roofline. Coast, and a house.
  coastline: (
    <React.Fragment>
      <path d="M4 10 L12 4 L20 10" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 4-1.6" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" />
      <path d="M3 19.5c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 4-1.6" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </React.Fragment>
  ),
  // A leaf on a stem. Ash, grove.
  ashgrove: (
    <React.Fragment>
      <path d="M12 21V11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12c0-5 3.5-8.5 8-9 .5 4.5-2.5 9-8 9z" fill="currentColor" />
      <path d="M11.4 15c-3.6 0-6.2-2.4-6.4-6 3.6-.2 6.2 2.1 6.4 6z" fill="currentColor" opacity="0.6" />
    </React.Fragment>
  ),
  // A globe with its meridian picked out.
  meridian: (
    <React.Fragment>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <ellipse cx="12" cy="12" rx="4" ry="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <path d="M12 3.5v17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </React.Fragment>
  ),
  // Two peaks, the taller one solid. A summit, and a rising column.
  pinnacle: (
    <React.Fragment>
      <path d="M12 4l7.5 15h-15z" fill="currentColor" />
      <path d="M6.5 11L2 19h9z" fill="currentColor" opacity="0.5" />
    </React.Fragment>
  ),
};

// The tile is the same across all four so they read as a set the portal
// issued, rather than four logos pasted in. Colour and glyph do the work.
function RfAgencyMark({ partner, size = 34 }) {
  const glyph = RF_PARTNER_GLYPHS[partner.id];
  if (!glyph) return null;
  return (
    <span
      className="rf-agency-tile"
      style={{ background: partner.accent, width: size, height: size, flexBasis: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={Math.round(size * 0.62)} height={Math.round(size * 0.62)}>
        {glyph}
      </svg>
    </span>
  );
}

const RF_DEALS = [
  // --- Coastline Property Group (agents want to know the buyer can bid) ---
  {
    id: 'rf1', partner: 'coastline', item: 'First home buyer · Wynnum West',
    sub: ['$720,000 budget', '5% deposit, FHG'], customer: 'K. Adeyemi', phone: '0491 570 006',
    stage: 'Pre-Approved', updated: rfDaysAgo(0, 12, 20),
    notes: [
      { t: 'Pre-approved to $735,000. Elise, she is clear to bid this Saturday and the guarantee place is locked in.', w: rfDaysAgo(0, 12, 20), by: 'Ben (Ready Finance)' },
      { t: 'Submitted for pre-approval. LMI is waived under the First Home Guarantee, so the 5% deposit is enough.', w: rfDaysAgo(4, 9, 10), by: 'Ben (Ready Finance)' },
      { t: 'Fact find done. Genuine savings history is strong, no adverse credit.', w: rfDaysAgo(7, 15, 30), by: 'Alana (Ready Finance)' },
    ],
  },
  {
    id: 'rf2', partner: 'coastline', item: 'Upgrader · 14 Marlin St, Manly',
    sub: ['$1,240,000', 'Finance clause 19th'], customer: 'The Brannigans', phone: '0491 570 012',
    stage: 'Valuation Ordered', updated: rfDaysAgo(1, 15, 5),
    notes: [
      { t: 'Valuation ordered, inspection booked Wednesday morning. Finance clause expires the 19th and we are comfortable with that.', w: rfDaysAgo(1, 15, 5), by: 'Ben (Ready Finance)' },
      { t: 'Full application lodged. Bridging is not needed, the sale of the Camp Hill place settles first.', w: rfDaysAgo(3, 11, 0), by: 'Ben (Ready Finance)' },
    ],
  },
  {
    id: 'rf3', partner: 'coastline', item: 'Investor · Chermside townhouse',
    sub: ['$610,000', 'Interest only'], customer: 'P. Nikolaidis', phone: '0491 570 019',
    stage: 'Documents Required', updated: rfDaysAgo(2, 10, 50),
    notes: [
      { t: 'Chasing the last two tax returns and the current rental statement on the Bracken Ridge property. Everything else is in.', w: rfDaysAgo(2, 10, 50), by: 'Alana (Ready Finance)' },
      { t: 'Fact find complete. Servicing works at 6.5% assessment rate with the existing rental income included.', w: rfDaysAgo(5, 14, 15), by: 'Alana (Ready Finance)' },
    ],
  },
  {
    id: 'rf4', partner: 'coastline', item: 'Downsizer · Shorncliffe',
    sub: ['$890,000', 'Small facility only'], customer: 'M. Whitlock', phone: '0491 570 023',
    stage: 'Settled', updated: rfDaysAgo(9, 13, 0),
    notes: [
      { t: 'Settled Tuesday. Keys handed over. Elise, thanks for the introduction, the referral fee is on this month statement.', w: rfDaysAgo(9, 13, 0), by: 'Ben (Ready Finance)' },
      { t: 'Unconditional. Settlement booked for the 2nd.', w: rfDaysAgo(16, 10, 40), by: 'Ben (Ready Finance)' },
    ],
  },

  // --- Ashgrove Buyers Advocacy (advocates want the buyer bid-ready) ---
  {
    id: 'rf5', partner: 'ashgrove', item: 'Buyers advocate client · Ascot',
    sub: ['$1,850,000', 'Approved to $1.9m'], customer: 'H. Okonkwo', phone: '0491 570 031',
    stage: 'Unconditional', updated: rfDaysAgo(1, 9, 0),
    notes: [
      { t: 'Unconditional this morning. Settlement 14 September, contract is with the solicitor. Cameron, you can tell them it is done.', w: rfDaysAgo(1, 9, 0), by: 'Ben (Ready Finance)' },
      { t: 'Formal approval received. Valuation came in at contract, no shortfall.', w: rfDaysAgo(4, 16, 20), by: 'Ben (Ready Finance)' },
    ],
  },
  {
    id: 'rf6', partner: 'ashgrove', item: 'Relocation buyer · Paddington',
    sub: ['$1,100,000 budget', 'Melbourne sale pending'], customer: 'J. Marchetti', phone: '0491 570 036',
    stage: 'Fact Find Booked', updated: rfDaysAgo(0, 16, 30),
    notes: [
      { t: 'Fact find booked Thursday 5pm. Moving up from Melbourne, the current place settles in six weeks, so timing is the whole conversation.', w: rfDaysAgo(0, 16, 30), by: 'Alana (Ready Finance)' },
      { t: 'Referral received from Ashgrove. Cameron has already shortlisted three streets.', w: rfDaysAgo(1, 8, 45), by: 'System' },
    ],
  },
  {
    id: 'rf7', partner: 'ashgrove', item: 'Investor · Toowong unit',
    sub: ['$520,000'], customer: 'R. Bhandari', phone: '0491 570 044',
    stage: 'Fell Through', updated: rfDaysAgo(12, 14, 0),
    notes: [
      { t: 'Buyer withdrew after the building report, nothing to do with finance. The pre-approval stays valid until 2 October, so we are ready the moment Cameron finds the next one.', w: rfDaysAgo(12, 14, 0), by: 'Ben (Ready Finance)' },
    ],
  },

  // --- Meridian Conveyancing (conveyancers live and die by the dates) ---
  {
    id: 'rf8', partner: 'meridian', item: 'Purchase · 8 Gilbert Rd, Wavell Heights',
    sub: ['$935,000', 'Finance clause 26th'], customer: 'The Okafors', phone: '0491 570 052',
    stage: 'Formal Approval', updated: rfDaysAgo(0, 11, 15),
    notes: [
      { t: 'Formal approval issued. Trish, you can satisfy the finance condition, we are five days inside the clause.', w: rfDaysAgo(0, 11, 15), by: 'Ben (Ready Finance)' },
      { t: 'Valuation returned at $940,000, slightly over contract. No conditions outstanding.', w: rfDaysAgo(2, 15, 45), by: 'Ben (Ready Finance)' },
    ],
  },
  {
    id: 'rf9', partner: 'meridian', item: 'Refinance · Carindale',
    sub: ['$610,000 loan', 'Rate review'], customer: 'S. Aluko', phone: '0491 570 061',
    stage: 'Full Application', updated: rfDaysAgo(1, 13, 30),
    notes: [
      { t: 'Lodged with the new lender. Saving is 0.58% against what they are on now, which is about $210 a month.', w: rfDaysAgo(1, 13, 30), by: 'Ben (Ready Finance)' },
      { t: 'Discharge form signed and sent to the outgoing lender.', w: rfDaysAgo(3, 9, 20), by: 'Alana (Ready Finance)' },
    ],
  },
  {
    id: 'rf10', partner: 'meridian', item: 'Purchase · Redcliffe duplex',
    sub: ['$780,000'], customer: 'D. Kaur', phone: '0491 570 068',
    stage: 'On Hold', updated: rfDaysAgo(3, 10, 5),
    notes: [
      { t: 'Parked at the client request until the employment probation ends on the 30th. Trish, no action needed at your end, I will restart it that week.', w: rfDaysAgo(3, 10, 5), by: 'Ben (Ready Finance)' },
    ],
  },

  // --- Pinnacle Accounting Partners (accountants think in entities) ---
  {
    id: 'rf11', partner: 'pinnacle', item: 'SMSF purchase · Springwood retail unit',
    sub: ['$640,000', 'LRBA'], customer: 'Vantage Super Fund', phone: '0491 570 073',
    stage: 'Property Found', updated: rfDaysAgo(1, 16, 0),
    notes: [
      { t: 'Property found and the fund has the liquidity. Deepa, I need the updated fund financials and the trust deed before I can lodge.', w: rfDaysAgo(1, 16, 0), by: 'Ben (Ready Finance)' },
      { t: 'Lender selected. Only two on the panel will do a limited recourse loan at this size.', w: rfDaysAgo(6, 11, 30), by: 'Ben (Ready Finance)' },
    ],
  },
  {
    id: 'rf12', partner: 'pinnacle', item: 'Self-employed buyer · Bardon',
    sub: ['$1,050,000', 'Alt doc'], customer: 'Corvin Trades Pty Ltd', phone: '0491 570 081',
    stage: 'Documents Required', updated: rfDaysAgo(2, 9, 40),
    notes: [
      { t: 'Need the accountant declaration and the last four BAS. Deepa, the declaration has to be on your letterhead, I have emailed you the wording.', w: rfDaysAgo(2, 9, 40), by: 'Alana (Ready Finance)' },
      { t: 'Alt doc route confirmed. FY25 returns are not lodged yet, so full doc is not an option this side of October.', w: rfDaysAgo(4, 14, 50), by: 'Ben (Ready Finance)' },
    ],
  },
  {
    id: 'rf13', partner: 'pinnacle', item: 'Investment purchase · Ipswich',
    sub: ['$495,000 estimated'], customer: 'T. Baptiste', phone: '0491 570 089',
    stage: 'New Referral', updated: rfDaysAgo(0, 8, 25),
    notes: [
      { t: 'Referral received from Pinnacle. Deepa flagged that the structure is still being decided, personal name versus trust. Calling this morning.', w: rfDaysAgo(0, 8, 25), by: 'System' },
    ],
  },
];

// ---- what they get ------------------------------------------------------
//
// No pricing anywhere on this page: Josh has not settled on it yet, and a
// number on screen is a number he is committed to the moment Ben reads it.
// Cost is a conversation, not a slide. This list is what the conversation is
// about.

const RF_INCLUDED = [
  'The board on your own address: ' + RF.domain,
  'Ready Finance logo and colours throughout, as on this page',
  'A separate portal for every referral partner',
  'Each partner sees only the buyers they referred, enforced in the database',
  'Your pipeline stages, the ones running on this board',
  'Full stage and note history on every deal',
  'Logins for your team, each person named on the notes they write',
  'Partner activity reporting',
  'Data held in Australia, encrypted, separated per firm',
  'A written data processing agreement before anything goes live',
];

const RF_SETUP = [
  {
    n: '1',
    title: 'Ben picks the address',
    body: `${RF.domain} is the obvious one, but it is whatever suits. If Ready Finance would rather not touch DNS at all, the portal comes up at readyfinance.brokenmind.com.au instead and step 2 disappears.`,
    who: 'Ben · 2 minutes',
  },
  {
    n: '2',
    title: 'One DNS record',
    body: 'Whoever looks after the Ready Finance domain adds a single CNAME record pointing that name at us. We send them the exact line to paste. The existing Ready Finance website is not touched, not moved, and not modified in any way.',
    who: 'Their web person · 5 minutes',
  },
  {
    n: '3',
    title: 'We brand it',
    body: 'Already done. This page is running the real Ready Finance logo and blue. Nothing else needs to be sent through.',
    who: 'Us · done',
  },
  {
    n: '4',
    title: 'We load the partners',
    body: 'Ben gives us the referrers and who at each one needs a login. We create the boards and email each person an invite so they set their own password. Nobody gets a password from us.',
    who: 'Us · same day',
  },
  {
    n: '5',
    title: 'A link on the Ready Finance site',
    body: 'A "Partner login" button in the menu pointing at the new address. We send the exact snippet. That is the only change to their site, and it is optional.',
    who: 'Their web person · 5 minutes',
  },
  {
    n: '6',
    title: 'They work the board',
    body: 'Add deals as referrals come in, change the stage as things move. The partners watch it happen and stop ringing to ask where their buyer is up to.',
    who: 'Ready Finance · ongoing',
  },
];

// ---- login screen mock --------------------------------------------------
//
// Answers the first question a referrer asks, which is "what do I actually
// get sent?". Purely a picture: the fields do nothing, and the button drops
// the viewer onto the board.
//
// Deliberately just email and password. An earlier version had the referrer
// pick their agency from a dropdown, which would have published the list of
// firms Ready Finance deals with to anyone who opened the login page. Who a
// broker's referral partners are is commercially sensitive, so the sign-in
// screen never names one. The account behind the email decides which board
// loads, exactly as it does in the live product.

function RfLoginMock({ onEnter }) {
  return (
    <div className="rf-login-wrap">
      <div className="rf-login-card">
        <img src={RF.logo} alt={RF.name} className="rf-login-logo" />
        <h1 className="rf-login-title">Partner login</h1>
        <p className="rf-login-sub">
          Track the buyers you have referred to {RF.name}.
        </p>

        <form
          className="rf-login-form"
          onSubmit={(e) => { e.preventDefault(); onEnter(); }}
        >
          <label className="deal-label" htmlFor="rf-login-email">Email</label>
          <input
            id="rf-login-email"
            className="rf-login-input"
            type="email"
            readOnly
            value="you@youragency.com.au"
          />

          <label className="deal-label" htmlFor="rf-login-pw">Password</label>
          <input
            id="rf-login-pw"
            className="rf-login-input"
            type="password"
            readOnly
            value="demo-password"
          />

          <button type="submit" className="rf-login-btn">Sign in</button>
          <span className="rf-login-help">Forgot your password?</span>
        </form>

        <p className="rf-login-foot">
          Demonstration screen. The fields do nothing. In the live portal each
          person sets their own password from an emailed invite, and {RF.short} never
          sees it.
        </p>
      </div>
      <p className="rf-login-url">{RF.domain}</p>
    </div>
  );
}

// ---- what's included and how it goes live -------------------------------

function RfHowItWorks() {
  return (
    <div className="pd-pricing">
      <section className="pd-sec">
        <h2 className="pd-h2">What Ready Finance gets</h2>
        <p className="pd-lede">
          A portal for every referral partner, on your address, under your brand.
          Add partners as they are won, switch one off if a relationship ends.
        </p>

        <ul className="pd-included">
          {RF_INCLUDED.map((f, i) => (
            <li key={i}><span className="pd-tick" aria-hidden="true">✓</span>{f}</li>
          ))}
        </ul>

        <p className="pd-fineprint">
          Cost is not on this page on purpose. Josh will talk it through with
          Ben directly rather than have a number sit here out of context.
        </p>
      </section>

      <section className="pd-sec">
        <h2 className="pd-h2">Getting it live</h2>
        <p className="pd-lede">
          Live in about a week, and most of that is waiting on Ready Finance. We
          never touch the existing website, we never need a login to it, and
          nothing is installed into it.
        </p>

        <ol className="pd-steps">
          {RF_SETUP.map((s) => (
            <li key={s.n} className="pd-step">
              <span className="pd-step-n" aria-hidden="true">{s.n}</span>
              <div className="pd-step-body">
                <h3 className="pd-step-title">{s.title}</h3>
                <p>{s.body}</p>
                <span className="pd-step-who">{s.who}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="pd-sec">
        <h2 className="pd-h2">The questions everyone asks</h2>
        <dl className="pd-faq">
          <dt>Can Coastline see what Ashgrove referred?</dt>
          <dd>
            Never. Each partner sees only the buyers they referred. It is
            enforced in the database itself, not by hiding things on screen.
            Switch between partners on the demo board and watch the rows
            disappear.
          </dd>

          <dt>Does this replace the CRM?</dt>
          <dd>
            No. The CRM is where Ready Finance works. This is the window the
            referral partners look through, so they stop ringing for updates.
            Whatever is already in place stays.
          </dd>

          <dt>Our pipeline does not look like this.</dt>
          <dd>
            The stages are yours to set. The board on this page runs a home loan
            pipeline; the same product runs an asset finance pipeline for a
            dealership today, and they share almost no stages.
          </dd>

          <dt>What about client privacy?</dt>
          <dd>
            Data is held in Australia, encrypted, and separated per firm at the
            database level. Partners see only their own referrals. A written data
            processing agreement is provided before anything goes live.
          </dd>

          <dt>What if a referral relationship ends?</dt>
          <dd>
            Switch that portal off. Their access dies immediately and the deals
            stay on the Ready Finance board.
          </dd>

          <dt>Can partners lodge referrals through it?</dt>
          <dd>
            That is next on the build list. Today they watch; shortly they will
            be able to lodge a referral straight onto the board.
          </dd>
        </dl>
      </section>
    </div>
  );
}

// ---- demo control bar ---------------------------------------------------
//
// Deliberately styled as scaffolding rather than product chrome, so Ben never
// mistakes it for something his referrers would see. Josh drives the whole
// demo from this one bar.

function RfDemoBar({ viewer, onViewer, onReset, dirty, mode, onMode }) {
  return (
    <div className="pd-bar rf-bar">
      <div className="pd-bar-inner">
        <div className="pd-bar-group rf-bar-brand">
          <img src={RF.logoWhite} alt={RF.name} className="rf-bar-logo" />
        </div>

        <div className="pd-bar-group">
          <span className="pd-bar-label">View</span>
          <div className="pd-seg">
            <button type="button" className={`pd-seg-btn${mode === 'board' ? ' is-on' : ''}`}
                    onClick={() => onMode('board')}>The board</button>
            <button type="button" className={`pd-seg-btn${mode === 'login' ? ' is-on' : ''}`}
                    onClick={() => onMode('login')}>Login screen</button>
            <button type="button" className={`pd-seg-btn${mode === 'how' ? ' is-on' : ''}`}
                    onClick={() => onMode('how')}>How it works</button>
          </div>
        </div>

        <div className="pd-bar-group" hidden={mode !== 'board'}>
          <span className="pd-bar-label">Signed in as</span>
          <div className="pd-seg">
            <button type="button"
                    className={`pd-seg-btn${viewer === 'staff' ? ' is-on' : ''}`}
                    onClick={() => onViewer('staff')}>
              Ready Finance staff
            </button>
            {RF_PARTNERS.map((p) => (
              <button key={p.id} type="button"
                      className={`pd-seg-btn${viewer === p.id ? ' is-on' : ''}`}
                      onClick={() => onViewer(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pd-bar-group pd-bar-end">
          {dirty && mode === 'board' && (
            <button type="button" className="pd-reset" onClick={onReset}>Reset demo</button>
          )}
          <span className="pd-bar-tag">Sample data</span>
        </div>
      </div>
    </div>
  );
}

// ---- one row ------------------------------------------------------------

function RfRow({ deal, canEdit, open, onToggle, onStage, onNote }) {
  const [noteText, setNoteText] = useStateRf('');
  const tone = rfTone(deal.stage);
  const notes = deal.notes;
  const latest = notes[0];
  const partner = RF_PARTNERS.find((p) => p.id === deal.partner);

  const submitNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onNote(deal.id, noteText.trim());
    setNoteText('');
  };

  return (
    <React.Fragment>
      <tr className={`board-row${open ? ' is-open' : ''}`}>
        <td className="board-cell board-cell-vehicle" data-label={RF.itemLabel}>
          <button type="button" className="board-vehicle-btn" aria-expanded={open} onClick={onToggle}>
            <span className="board-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
            <span className="board-vehicle">{deal.item}</span>
          </button>
          <span className="board-vehicle-sub">
            {deal.sub.filter(Boolean).map((s, i) => <span key={i}>{s}</span>)}
          </span>
        </td>

        <td className="board-cell board-cell-name" data-label={RF.customerLabel}>{deal.customer}</td>

        <td className="board-cell board-cell-phone" data-label="Phone">
          <a href={rfTel(deal.phone)}>{deal.phone}</a>
        </td>

        <td className="board-cell board-cell-note" data-label="Latest note">
          {latest ? (
            <React.Fragment>
              <span className="board-note-text">{latest.t}</span>
              <span className="board-note-when">{rfWhen(latest.w)}{latest.by ? ` · ${latest.by}` : ''}</span>
            </React.Fragment>
          ) : <span className="board-blank">No notes yet</span>}
        </td>

        {/* Ready Finance staff drive the board from here. A partner reads it.
            In the real product this is enforced by row-level security in
            Postgres, not by hiding the control. */}
        <td className="board-cell board-cell-status" data-label="Status">
          {canEdit ? (
            <select className={`board-status-select tone-${tone}`} value={deal.stage}
                    aria-label={`Stage for ${deal.item}`}
                    onChange={(e) => onStage(deal.id, e.target.value)}>
              {RF_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span className={`deal-badge tone-${tone}`}>{deal.stage}</span>
          )}
        </td>
      </tr>

      {open && (
        <tr className="board-detail-row">
          <td className="board-detail-cell" colSpan={5}>
            <div className="board-detail">
              <div className="board-detail-facts">
                <p className="deal-updated">Last updated: {rfWhen(deal.updated)}</p>
                <p className="deal-updated rf-referred">
                  Referred by:
                  {partner && <RfAgencyMark partner={partner} size={22} />}
                  <span className="rf-referred-name">{deal.partnerName}</span>
                </p>
              </div>

              <ol className="deal-history">
                {notes.map((n, i) => (
                  <li key={i}>
                    <p className="deal-note-when">{rfWhen(n.w)}</p>
                    <p className="deal-note-text">{n.t}</p>
                    {n.by && <p className="deal-note-who">by {n.by}</p>}
                  </li>
                ))}
              </ol>

              {canEdit && (
                <div className="deal-staff-tools">
                  <form onSubmit={submitNote} className="deal-note-form">
                    <label htmlFor={`rf-note-${deal.id}`} className="deal-label">Add an update</label>
                    <textarea id={`rf-note-${deal.id}`} rows={2} value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Valuation came back at contract…" />
                    <button type="submit" className="btn primary deal-btn-sm" disabled={!noteText.trim()}>
                      Add note
                    </button>
                  </form>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

// ---- one stage group ----------------------------------------------------

function RfGroup({ stage, deals, collapsed, onToggleGroup, openIds, onToggleRow, ...rowProps }) {
  const tone = rfTone(stage);
  const headingId = `rf-group-${stage.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <section className="board-group" aria-labelledby={headingId}>
      <h2 className={`board-group-head tone-${tone}`}>
        <button type="button" className="board-group-btn" id={headingId}
                aria-expanded={!collapsed} onClick={() => onToggleGroup(stage)}>
          <span className="board-caret" aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
          <span className="board-group-name">{stage}</span>
          <span className="board-group-count">{deals.length}</span>
        </button>
      </h2>

      {!collapsed && (
        <div className="board-table-wrap">
          <table className="board-table">
            <thead>
              <tr>
                <th scope="col" className="board-cell-vehicle">{RF.itemLabel}</th>
                <th scope="col" className="board-cell-name">{RF.customerLabel}</th>
                <th scope="col" className="board-cell-phone">Phone</th>
                <th scope="col" className="board-cell-note">Latest note</th>
                <th scope="col" className="board-cell-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <RfRow key={d.id} deal={d} {...rowProps}
                       open={openIds.has(d.id)} onToggle={() => onToggleRow(d.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---- page ---------------------------------------------------------------

function ReadyFinanceDemoPage() {
  rfNoIndex();

  const [mode, setMode] = useStateRf('board');          // 'board' | 'login' | 'how'
  const [viewer, setViewer] = useStateRf('staff');
  const [overrides, setOverrides] = useStateRf({});     // dealId -> { stage, notes, updated }
  const [openIds, setOpenIds] = useStateRf(() => new Set());
  const [collapsed, setCollapsed] = useStateRf(() => new Set());

  useEffectRf(() => {
    document.title = `Referral Partner Portal · ${RF.name} demo`;
  }, []);

  const reset = () => {
    setOverrides({});
    setOpenIds(new Set());
  };

  // Seed data merged with anything changed during the demo.
  const allDeals = useMemoRf(() => RF_DEALS.map((d) => {
    const o = overrides[d.id] || {};
    const partner = RF_PARTNERS.find((p) => p.id === d.partner);
    return {
      ...d,
      stage: o.stage || d.stage,
      notes: o.notes || d.notes,
      updated: o.updated || d.updated,
      partnerName: partner ? partner.name : '',
    };
  }), [overrides]);

  const isStaff = viewer === 'staff';
  const activePartner = isStaff ? null : RF_PARTNERS.find((p) => p.id === viewer);

  // The whole point of the demo. A partner sees only their own referrals, and
  // the count in the scope line makes the other rows' absence explicit rather
  // than something Ben has to take on faith.
  const visible = isStaff ? allDeals : allDeals.filter((d) => d.partner === viewer);

  const grouped = useMemoRf(() => {
    const out = [];
    for (const stage of RF_STAGES) {
      const rows = visible.filter((d) => d.stage === stage);
      if (rows.length) out.push({ stage, rows });
    }
    return out;
  }, [visible]);

  const toggleRow = (id) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleGroup = (stage) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(stage)) next.delete(stage); else next.add(stage);
    return next;
  });

  // Stage changes write their own history entry, exactly as the live product
  // does. It is the detail that makes the demo feel real rather than clickable.
  const changeStage = (id, stage) => {
    const deal = allDeals.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    const entry = {
      t: `Stage changed from "${deal.stage}" to "${stage}".`,
      w: new Date().toISOString(),
      by: 'You (demo)',
    };
    setOverrides((prev) => ({
      ...prev,
      [id]: { stage, notes: [entry, ...deal.notes], updated: entry.w },
    }));
  };

  const addNote = (id, text) => {
    const deal = allDeals.find((d) => d.id === id);
    if (!deal) return;
    const entry = { t: text, w: new Date().toISOString(), by: 'You (demo)' };
    setOverrides((prev) => ({
      ...prev,
      [id]: { stage: deal.stage, notes: [entry, ...deal.notes], updated: entry.w },
    }));
  };

  // Signing in on the mock lands on a partner's read-only board, which is the
  // view the login screen implies. Which partner is not chosen on that screen
  // (see RfLoginMock); Josh switches between them from the demo bar.
  const enterAsPartner = () => {
    setViewer(RF_PARTNERS[0].id);
    setMode('board');
  };

  const dirty = Object.keys(overrides).length > 0;

  return (
    <div className="deal-shell pd-shell rf-shell" style={{ '--pd-accent': RF.accent }}>
      <RfDemoBar
        viewer={viewer}
        onViewer={setViewer}
        onReset={reset}
        dirty={dirty}
        mode={mode}
        onMode={setMode}
      />

      {mode === 'login' && (
        <div className="deal-page">
          <RfLoginMock onEnter={enterAsPartner} />
        </div>
      )}

      {mode === 'how' && (
        <div className="deal-page">
          <RfHowItWorks />
          <footer className="pd-foot">
            <p className="pd-foot-credit">
              Referral Partner Portal · built by{' '}
              <a href="https://brokenmind.com.au" target="_blank" rel="noopener noreferrer">BrokenMind Software</a>
            </p>
          </footer>
        </div>
      )}

      {mode === 'board' && (
      <React.Fragment>
      <div className="pd-note">
        <strong>{RF.name}.</strong> Home loans. Agents, buyers advocates,
        conveyancers and accountants watch the buyers they sent through.
      </div>

      <div className="deal-page">
        {/* Their branding on their own address. This header is the answer to
            "so it sits on my website?" */}
        <header className="pd-brandbar rf-brandbar">
          <div className="pd-brand">
            <img src={RF.logo} alt={RF.name} className="rf-brand-logo" />
            <span className="rf-brand-domain">{RF.domain}</span>
          </div>
          <div className="pd-whoami">
            {isStaff ? (
              <React.Fragment>
                <span className="deal-role">Ready Finance staff</span>
                <span className="pd-whoami-sub">Full access · all referral partners</span>
              </React.Fragment>
            ) : (
              // Co-branded: Ready Finance's portal, but the agency looking at
              // it sees itself in the corner.
              <div className="rf-whoami-partner">
                <RfAgencyMark partner={activePartner} />
                <span className="rf-whoami-text">
                  <span className="deal-role">{activePartner.name}</span>
                  <span className="pd-whoami-sub">
                    Signed in as {activePartner.signedInAs} · {activePartner.kind} · view only
                  </span>
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="pd-scope">
          {isStaff ? (
            <React.Fragment>
              Showing <strong>all {allDeals.length} buyers</strong> across{' '}
              <strong>{RF_PARTNERS.length} referral partners</strong>. Change a stage or add a
              note and the partner sees it immediately.
            </React.Fragment>
          ) : (
            <React.Fragment>
              Showing <strong>{visible.length} of {allDeals.length} buyers</strong>. {activePartner.name}{' '}
              can only ever see the {visible.length} they referred. The other{' '}
              {allDeals.length - visible.length} belong to different partners and are invisible here.
            </React.Fragment>
          )}
        </div>

        {grouped.length === 0 ? (
          <p className="deal-empty">No buyers on this board yet.</p>
        ) : (
          grouped.map(({ stage, rows }) => (
            <RfGroup
              key={stage}
              stage={stage}
              deals={rows}
              collapsed={collapsed.has(stage)}
              onToggleGroup={toggleGroup}
              openIds={openIds}
              onToggleRow={toggleRow}
              canEdit={isStaff}
              onStage={changeStage}
              onNote={addNote}
            />
          ))
        )}

        <footer className="pd-foot">
          <p>
            Demonstration only. Every applicant, property, phone number and note
            on this page is invented. No real customer information is stored or
            displayed. The Ready Finance logo is used with permission for this
            demonstration.
          </p>
          <p className="pd-foot-credit">
            Referral Partner Portal · built by{' '}
            <a href="https://brokenmind.com.au" target="_blank" rel="noopener noreferrer">BrokenMind Software</a>
          </p>
        </footer>
      </div>
      </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { ReadyFinanceDemoPage });
