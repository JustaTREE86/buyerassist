/* global React */
// =============================================================
// Referral Partner Portal — sales demo, /portal-demo
//
// A prototype Josh presents to other brokers. It is NOT the product and it is
// NOT connected to anything:
//
//   - no API calls, no Supabase, no auth, no cookies
//   - every deal, partner and note below is invented
//   - all state lives in this component and resets on reload
//
// That is deliberate. A demo holding real client data would breach BrokerMind
// permanent rule 11 and drag the Privacy Act into a sales call. It also means
// nothing can fail live: no network, no cold start, no login to fumble.
//
// The demo's job is to answer the three questions every broker asks:
//   1. "What does my referrer actually see?"      -> viewer switcher
//   2. "Can they see each other's deals?"         -> switch partners, rows vanish
//   3. "Does it work for MY kind of referrer?"    -> four verticals, not just cars
//
// Phone numbers are from the ACMA range reserved for fiction (0491 570 006 to
// 0491 570 156) so nothing here can ring a real person. Emails use example.com.
// =============================================================
const {
  useState: useStatePd,
  useEffect: useEffectPd,
  useMemo: useMemoPd,
} = React;

// ---- helpers ------------------------------------------------------------

// Seed data is written in "days ago" so the board always looks live, whether
// Josh demos it today or in six months.
function pdDaysAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pdWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s*(am|pm)$/i, (m) => m.toUpperCase());
  return `${date}, ${time}`;
}

// Stage names differ per vertical, so tone is derived from the words rather
// than a lookup table. Colour is never the only signal: the written stage is
// always rendered next to it.
function pdTone(stage) {
  const s = String(stage || '').toLowerCase();
  if (/declin|cancel|fell through|unable|withdrawn/.test(s)) return 'bad';
  if (/settled|funded|unconditional/.test(s)) return 'done';
  if (/approv|booked|issued|found/.test(s)) return 'good';
  if (/required|waiting|hold|verif|requested|chasing/.test(s)) return 'attention';
  if (/^new /.test(s)) return 'new';
  return 'progress';
}

function pdTel(mobile) {
  const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

function pdNoIndex() {
  useEffectPd(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

// ---- the four scenarios -------------------------------------------------
//
// Each scenario is a different broker vertical with a different kind of
// referral partner. They differ in the things a prospect will poke at:
// brand, pipeline stages, the label on the first column, and what a "deal"
// even is. Same product underneath.

const PD_SCENARIOS = [
  // ---------------------------------------------------------------
  // 1. Car dealership -> asset finance broker. The proven case: this is
  //    what already runs live for a real dealership today.
  // ---------------------------------------------------------------
  {
    id: 'auto',
    tab: 'Car dealership',
    blurb: 'Asset finance broker. Dealership sales staff watch the finance on cars they sold.',
    broker: {
      name: 'Northbridge Asset Finance',
      initials: 'NA',
      accent: '#0A1F3D',
      domain: 'partners.northbridgefinance.com.au',
    },
    itemLabel: 'Vehicle',
    customerLabel: 'Customer',
    stages: [
      'New Referral', 'Contacting Customer', 'Application Sent', 'Documents Required',
      'Assessing', 'Submitted to Lender', 'Conditional Approval', 'Settlement Booked',
      'Settled', 'On Hold', 'Declined', 'Unable to Contact',
    ],
    partners: [
      { id: 'northside', name: 'Northside Auto Group', signedInAs: 'Dean' },
      { id: 'gateway', name: 'Gateway Prestige Cars', signedInAs: 'Priya' },
      { id: 'riverside', name: 'Riverside Truck Sales', signedInAs: 'Marco' },
    ],
    deals: [
      {
        id: 'a1', partner: 'northside', item: '2022 Ford Ranger Wildtrak',
        sub: ['$62,400', '881XKQ'], customer: 'J. Whitfield', phone: '0491 570 006',
        stage: 'Settlement Booked', updated: pdDaysAgo(0, 9, 15),
        notes: [
          { t: 'Settlement booked for Thursday 9am. Dealer to have the car detailed and ready.', w: pdDaysAgo(0, 9, 15), by: 'Amy (Northbridge)' },
          { t: 'Formal approval received. Rate 7.29%, 60 months, no conditions outstanding.', w: pdDaysAgo(1, 15, 40), by: 'Amy (Northbridge)' },
          { t: 'Stage changed from "Submitted to Lender" to "Conditional Approval".', w: pdDaysAgo(2, 11, 5), by: 'Amy (Northbridge)' },
        ],
      },
      {
        id: 'a2', partner: 'northside', item: '2021 Toyota HiLux SR5',
        sub: ['$54,990', '729ABX'], customer: 'M. Osei', phone: '0491 570 012',
        stage: 'Documents Required', updated: pdDaysAgo(1, 14, 20),
        notes: [
          { t: 'Chasing two payslips and 90 days of bank statements. Customer says he will send tonight.', w: pdDaysAgo(1, 14, 20), by: 'Amy (Northbridge)' },
          { t: 'Application form returned and reviewed. Everything else looks clean.', w: pdDaysAgo(3, 10, 0), by: 'Amy (Northbridge)' },
        ],
      },
      {
        id: 'a3', partner: 'northside', item: '2023 Isuzu D-MAX X-Terrain',
        sub: ['$71,200'], customer: 'R. Tanaka', phone: '0491 570 019',
        stage: 'New Referral', updated: pdDaysAgo(0, 8, 5),
        notes: [
          { t: 'Referral received from Northside. Dean flagged it as a hot one, deposit already paid.', w: pdDaysAgo(0, 8, 5), by: 'System' },
        ],
      },
      {
        id: 'a4', partner: 'gateway', item: '2020 BMW X5 xDrive30d',
        sub: ['$88,500', '412RJD'], customer: 'L. Fenwick', phone: '0491 570 023',
        stage: 'Submitted to Lender', updated: pdDaysAgo(2, 16, 10),
        notes: [
          { t: 'Submitted to lender this afternoon. Expect an answer inside 48 hours.', w: pdDaysAgo(2, 16, 10), by: 'Josh (Northbridge)' },
          { t: 'Preliminary assessment complete. Servicing is comfortable.', w: pdDaysAgo(3, 9, 30), by: 'Josh (Northbridge)' },
        ],
      },
      {
        id: 'a5', partner: 'gateway', item: '2019 Mercedes-Benz C300',
        sub: ['$47,000'], customer: 'S. Aluko', phone: '0491 570 031',
        stage: 'Settled', updated: pdDaysAgo(6, 13, 0),
        notes: [
          { t: 'Settled and funds disbursed to Gateway. Thanks for the referral.', w: pdDaysAgo(6, 13, 0), by: 'Josh (Northbridge)' },
        ],
      },
      {
        id: 'a6', partner: 'riverside', item: '2018 Kenworth T610 prime mover',
        sub: ['$185,000'], customer: 'Delaney Haulage Pty Ltd', phone: '0491 570 044',
        stage: 'Conditional Approval', updated: pdDaysAgo(1, 11, 45),
        notes: [
          { t: 'Conditional approval subject to a signed supplier invoice and proof of the trade.', w: pdDaysAgo(1, 11, 45), by: 'Josh (Northbridge)' },
        ],
      },
      {
        id: 'a7', partner: 'riverside', item: '2020 Hino 500 Series tipper',
        sub: ['$96,500'], customer: 'Kirra Civil Pty Ltd', phone: '0491 570 052',
        stage: 'Declined', updated: pdDaysAgo(4, 15, 20),
        notes: [
          { t: 'Declined on ABN age, the entity is nine months old. Trying a second lender who accepts 6 months plus.', w: pdDaysAgo(4, 15, 20), by: 'Josh (Northbridge)' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // 2. Accountant -> commercial / equipment finance broker. Proves the
  //    product is not car-shaped: the asset is a machine, the customer
  //    is an entity, and the docs are financials rather than payslips.
  // ---------------------------------------------------------------
  {
    id: 'commercial',
    tab: 'Accountant',
    blurb: 'Equipment and commercial finance. Accountants track funding for their business clients.',
    broker: {
      name: 'Meridian Commercial',
      initials: 'MC',
      accent: '#0E2A1F',
      domain: 'clients.meridiancommercial.com.au',
    },
    itemLabel: 'Asset / facility',
    customerLabel: 'Business',
    stages: [
      'New Referral', 'Contacting Client', 'Financials Requested', 'Financials Received',
      'Credit Assessment', 'Submitted to Lender', 'Conditional Approval', 'Documents Issued',
      'Settled', 'On Hold', 'Declined',
    ],
    partners: [
      { id: 'hargrave', name: 'Hargrave & Co Accountants', signedInAs: 'Bridget' },
      { id: 'pinnacle', name: 'Pinnacle Business Advisory', signedInAs: 'Tom' },
    ],
    deals: [
      {
        id: 'c1', partner: 'hargrave', item: 'CAT 308 excavator',
        sub: ['$142,000', 'Chattel mortgage'], customer: 'Bayline Earthworks Pty Ltd', phone: '0491 570 061',
        stage: 'Documents Issued', updated: pdDaysAgo(0, 11, 30),
        notes: [
          { t: 'Docs issued for signing. Once returned we settle same day.', w: pdDaysAgo(0, 11, 30), by: 'Nadia (Meridian)' },
          { t: 'Approved at 8.15% over 60 months with a 20% balloon, as modelled.', w: pdDaysAgo(2, 14, 0), by: 'Nadia (Meridian)' },
        ],
      },
      {
        id: 'c2', partner: 'hargrave', item: 'Fit-out and kitchen equipment',
        sub: ['$78,000', 'Equipment loan'], customer: 'Sorrel Hospitality Group', phone: '0491 570 068',
        stage: 'Financials Requested', updated: pdDaysAgo(3, 9, 45),
        notes: [
          { t: 'Waiting on FY25 financials and the latest BAS. Bridget, can you send these through when you have them?', w: pdDaysAgo(3, 9, 45), by: 'Nadia (Meridian)' },
        ],
      },
      {
        id: 'c3', partner: 'hargrave', item: '$250k working capital facility',
        sub: ['Unsecured', '12 months'], customer: 'Verity Trades Pty Ltd', phone: '0491 570 073',
        stage: 'Credit Assessment', updated: pdDaysAgo(1, 16, 15),
        notes: [
          { t: 'Serviceability is fine. Preparing the submission around the seasonal dip in Q3.', w: pdDaysAgo(1, 16, 15), by: 'Nadia (Meridian)' },
        ],
      },
      {
        id: 'c4', partner: 'pinnacle', item: '2 x Toyota HiAce vans',
        sub: ['$96,400', 'Chattel mortgage'], customer: 'Halcyon Plumbing Pty Ltd', phone: '0491 570 081',
        stage: 'Settled', updated: pdDaysAgo(9, 10, 0),
        notes: [
          { t: 'Both vans settled. Invoices and the settlement letter are with the client.', w: pdDaysAgo(9, 10, 0), by: 'Nadia (Meridian)' },
        ],
      },
      {
        id: 'c5', partner: 'pinnacle', item: 'CNC machining centre',
        sub: ['$310,000', 'Chattel mortgage'], customer: 'Ardent Precision Pty Ltd', phone: '0491 570 089',
        stage: 'New Referral', updated: pdDaysAgo(0, 8, 40),
        notes: [
          { t: 'Referral received from Pinnacle. Import from Germany, 14 week lead time, so a progress payment structure is likely.', w: pdDaysAgo(0, 8, 40), by: 'System' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // 3. Real estate / buyers agent -> mortgage broker. The biggest market
  //    by far, and the one that proves the pipeline is configurable: none
  //    of these stages exist in the asset finance board.
  // ---------------------------------------------------------------
  {
    id: 'mortgage',
    tab: 'Real estate agent',
    blurb: 'Mortgage broking. Agents and buyers advocates see where their buyer is up to.',
    broker: {
      name: 'Vale & Hart Mortgages',
      initials: 'VH',
      accent: '#1F1410',
      domain: 'partners.valehart.com.au',
    },
    itemLabel: 'Buyer / property',
    customerLabel: 'Applicant',
    stages: [
      'New Referral', 'Contacting Buyer', 'Fact Find Booked', 'Documents Required',
      'Pre-Approval Submitted', 'Pre-Approved', 'Property Found', 'Full Application',
      'Valuation Ordered', 'Formal Approval', 'Unconditional', 'Settled', 'Fell Through',
    ],
    partners: [
      { id: 'raycoastal', name: 'Ray Coastal Property', signedInAs: 'Elise' },
      { id: 'ashford', name: 'Ashford Buyers Agency', signedInAs: 'Cameron' },
    ],
    deals: [
      {
        id: 'm1', partner: 'raycoastal', item: 'First home buyer — Wynnum',
        sub: ['$780,000 budget', '10% deposit'], customer: 'K. Adeyemi', phone: '0491 570 095',
        stage: 'Pre-Approved', updated: pdDaysAgo(0, 12, 20),
        notes: [
          { t: 'Pre-approved to $795k. Elise, she is ready to bid this Saturday.', w: pdDaysAgo(0, 12, 20), by: 'Dan (Vale & Hart)' },
          { t: 'Submitted for pre-approval. LMI waiver applies under the first home guarantee.', w: pdDaysAgo(4, 9, 10), by: 'Dan (Vale & Hart)' },
        ],
      },
      {
        id: 'm2', partner: 'raycoastal', item: 'Upgrader — 14 Marlin St, Manly',
        sub: ['$1,240,000', 'Subject to finance'], customer: 'The Brannigans', phone: '0491 570 101',
        stage: 'Valuation Ordered', updated: pdDaysAgo(1, 15, 5),
        notes: [
          { t: 'Valuation ordered, inspection booked Wednesday. Finance clause expires the 19th, we are comfortable.', w: pdDaysAgo(1, 15, 5), by: 'Dan (Vale & Hart)' },
        ],
      },
      {
        id: 'm3', partner: 'raycoastal', item: 'Investor — Chermside townhouse',
        sub: ['$610,000', 'Interest only'], customer: 'P. Nikolaidis', phone: '0491 570 108',
        stage: 'Documents Required', updated: pdDaysAgo(2, 10, 50),
        notes: [
          { t: 'Need the last two tax returns and the current rental statement on the Bracken Ridge property.', w: pdDaysAgo(2, 10, 50), by: 'Dan (Vale & Hart)' },
        ],
      },
      {
        id: 'm4', partner: 'ashford', item: 'Buyers advocate client — Ascot',
        sub: ['$1,850,000', 'Pre-approval'], customer: 'H. Okonkwo', phone: '0491 570 114',
        stage: 'Unconditional', updated: pdDaysAgo(1, 9, 0),
        notes: [
          { t: 'Unconditional. Settlement 14 September. Cameron, contract is with the solicitor.', w: pdDaysAgo(1, 9, 0), by: 'Dan (Vale & Hart)' },
        ],
      },
      {
        id: 'm5', partner: 'ashford', item: 'Relocation buyer — Paddington',
        sub: ['$1,100,000 budget'], customer: 'J. Marchetti', phone: '0491 570 121',
        stage: 'Fact Find Booked', updated: pdDaysAgo(0, 16, 30),
        notes: [
          { t: 'Fact find booked Thursday 5pm. Moving from Melbourne, settlement on the current place is in six weeks.', w: pdDaysAgo(0, 16, 30), by: 'Dan (Vale & Hart)' },
        ],
      },
      {
        id: 'm6', partner: 'ashford', item: 'Investor — Toowong unit',
        sub: ['$520,000'], customer: 'R. Bhandari', phone: '0491 570 127',
        stage: 'Fell Through', updated: pdDaysAgo(11, 14, 0),
        notes: [
          { t: 'Buyer withdrew after the building report. Pre-approval stays valid until 2 October, so we are ready when the next one comes up.', w: pdDaysAgo(11, 14, 0), by: 'Dan (Vale & Hart)' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // 4. Solar installer -> personal / green loan broker. High volume,
  //    small ticket, fast cycle. Proves the board reads well when a
  //    partner has a lot of deals moving quickly.
  // ---------------------------------------------------------------
  {
    id: 'solar',
    tab: 'Home improvement',
    blurb: 'Personal and green lending. Installers watch finance approvals before booking the job.',
    broker: {
      name: 'Lumen Green Finance',
      initials: 'LG',
      accent: '#143828',
      domain: 'installers.lumengreen.com.au',
    },
    itemLabel: 'Job',
    customerLabel: 'Customer',
    stages: [
      'New Referral', 'Contacting Customer', 'Application Sent', 'ID Verification',
      'Submitted to Lender', 'Approved', 'Install Booked', 'Funded', 'On Hold', 'Declined',
    ],
    partners: [
      { id: 'sunfit', name: 'SunFit Solar', signedInAs: 'Kelly' },
      { id: 'ecovolt', name: 'EcoVolt Energy', signedInAs: 'Raj' },
    ],
    deals: [
      {
        id: 's1', partner: 'sunfit', item: '13.2kW system + 10kWh battery',
        sub: ['$18,900'], customer: 'D. Prasad', phone: '0491 570 133',
        stage: 'Install Booked', updated: pdDaysAgo(0, 10, 10),
        notes: [
          { t: 'Approved and install booked for the 22nd. Funds release on completion certificate.', w: pdDaysAgo(0, 10, 10), by: 'Sam (Lumen)' },
        ],
      },
      {
        id: 's2', partner: 'sunfit', item: '6.6kW system',
        sub: ['$7,400'], customer: 'A. Ferreira', phone: '0491 570 139',
        stage: 'ID Verification', updated: pdDaysAgo(0, 14, 45),
        notes: [
          { t: 'Waiting on the digital ID check. Customer started it, has not finished. Kelly, a nudge from you would help.', w: pdDaysAgo(0, 14, 45), by: 'Sam (Lumen)' },
        ],
      },
      {
        id: 's3', partner: 'sunfit', item: 'Ducted air conditioning',
        sub: ['$12,200'], customer: 'M. Sullivan', phone: '0491 570 145',
        stage: 'Funded', updated: pdDaysAgo(5, 11, 0),
        notes: [
          { t: 'Funded. Payment landed in the SunFit account this morning.', w: pdDaysAgo(5, 11, 0), by: 'Sam (Lumen)' },
        ],
      },
      {
        id: 's4', partner: 'sunfit', item: '10kW system + EV charger',
        sub: ['$15,600'], customer: 'T. Nguyen', phone: '0491 570 150',
        stage: 'New Referral', updated: pdDaysAgo(0, 8, 20),
        notes: [
          { t: 'Referral received from SunFit. Quote attached, customer wants it done before the end of the quarter.', w: pdDaysAgo(0, 8, 20), by: 'System' },
        ],
      },
      {
        id: 's5', partner: 'ecovolt', item: '8.8kW system',
        sub: ['$9,800'], customer: 'B. Hollands', phone: '0491 570 156',
        stage: 'Submitted to Lender', updated: pdDaysAgo(1, 13, 25),
        notes: [
          { t: 'Submitted. These usually come back same day, so expect an answer this afternoon.', w: pdDaysAgo(1, 13, 25), by: 'Sam (Lumen)' },
        ],
      },
      {
        id: 's6', partner: 'ecovolt', item: 'Battery retrofit',
        sub: ['$11,400'], customer: 'C. Rewi', phone: '0491 570 006',
        stage: 'Declined', updated: pdDaysAgo(7, 15, 50),
        notes: [
          { t: 'Declined on recent defaults. Referred to our credit repair partner, worth revisiting in about six months.', w: pdDaysAgo(7, 15, 50), by: 'Sam (Lumen)' },
        ],
      },
    ],
  },
];

// ---- pricing --------------------------------------------------------------
//
// Priced on partner count, not staff seats. Partner count is the number that
// grows when the customer succeeds, so the account expands without anyone
// having to sell into it again. Staff seats are the wrong meter: a broker adds
// those once and never again.

const PD_PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: '$99',
    per: 'per month',
    best: 'One broker, a handful of referrers.',
    features: [
      'Up to 3 referral partner portals',
      'Unlimited deals',
      'Hosted at yourname.brokenmind.com.au',
      '2 staff logins',
      'Full stage history on every deal',
      'Email support',
    ],
  },
  {
    id: 'practice',
    name: 'Practice',
    price: '$249',
    per: 'per month',
    featured: true,
    best: 'The common one. A growing referral network.',
    features: [
      'Up to 10 referral partner portals',
      'Your own domain: partners.yourfirm.com.au',
      'Your logo and colours throughout',
      '5 staff logins',
      'Custom pipeline stages',
      'Partner activity reporting',
      'Priority email support',
    ],
  },
  {
    id: 'brokerage',
    name: 'Brokerage',
    price: '$499',
    per: 'per month',
    best: 'Multi-broker firms and dealer groups.',
    features: [
      'Up to 25 referral partner portals',
      'Unlimited staff logins',
      'Per-broker views and reporting',
      'Custom stages per partner type',
      'Onboarding call for each new partner',
      'Priority support',
    ],
  },
];

const PD_ADDONS = [
  ['Extra referral partner', '+$25 per month each', 'On any plan. Add or remove them whenever.'],
  ['Setup and onboarding', '$750 once', 'Practice and Brokerage. Domain, branding, data import, a training call for your team.'],
  ['Annual payment', '2 months free', 'Pay for 12 months up front, pay for 10.'],
];

const PD_SETUP = [
  {
    n: '1',
    title: 'You pick a name',
    body: 'partners.yourfirm.com.au, clients.yourfirm.com.au, whatever suits. If you would rather not touch DNS at all, you get yourfirm.brokenmind.com.au instead and skip step 2.',
    who: 'You · 2 minutes',
  },
  {
    n: '2',
    title: 'One DNS record',
    body: 'Whoever looks after your domain adds a single CNAME record pointing that name at us. We send them the exact line to paste. Your existing website is not touched, not moved, and not modified in any way.',
    who: 'Your web person · 5 minutes',
  },
  {
    n: '3',
    title: 'We brand it',
    body: 'Send us your logo and your colours. The portal comes up looking like your firm, not like ours.',
    who: 'Us · same day',
  },
  {
    n: '4',
    title: 'We load your partners',
    body: 'Give us your referrers and who at each one needs a login. We create the boards and email each person an invite so they set their own password.',
    who: 'Us · same day',
  },
  {
    n: '5',
    title: 'You add a link',
    body: 'Put a "Partner Login" button in your website menu pointing at your new address. We send you the exact snippet. That is the only change to your site, and it is optional.',
    who: 'Your web person · 5 minutes',
  },
  {
    n: '6',
    title: 'You work the board',
    body: 'Add deals as referrals come in, drag the stage as things move. Your partners watch it happen and stop ringing to ask.',
    who: 'You · ongoing',
  },
];

function PdPricing() {
  return (
    <div className="pd-pricing">
      <section className="pd-sec">
        <h2 className="pd-h2">Pricing</h2>
        <p className="pd-lede">
          Priced on how many referral partners you give a portal to. Add partners as you win
          them, remove them if a relationship ends. No lock-in contract, cancel any month.
        </p>

        <div className="pd-plans">
          {PD_PLANS.map((p) => (
            <div key={p.id} className={`pd-plan${p.featured ? ' is-featured' : ''}`}>
              {p.featured && <span className="pd-plan-flag">Most brokers start here</span>}
              <h3 className="pd-plan-name">{p.name}</h3>
              <p className="pd-plan-price">
                <span className="pd-plan-amount">{p.price}</span>
                <span className="pd-plan-per">{p.per}</span>
              </p>
              <p className="pd-plan-best">{p.best}</p>
              <ul className="pd-plan-feats">
                {p.features.map((f, i) => (
                  <li key={i}><span className="pd-tick" aria-hidden="true">✓</span>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <table className="pd-addons">
          <tbody>
            {PD_ADDONS.map(([what, cost, detail], i) => (
              <tr key={i}>
                <th scope="row">{what}</th>
                <td className="pd-addon-cost">{cost}</td>
                <td className="pd-addon-detail">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="pd-fineprint">
          All prices in AUD and exclude GST. What you actually pay: a broker on Practice with
          14 referral partners pays $249 plus 4 extra partners at $25, so $349 a month.
        </p>
      </section>

      <section className="pd-sec">
        <h2 className="pd-h2">Getting it on your website</h2>
        <p className="pd-lede">
          Live in about a week, and most of that is waiting on you. We never touch your
          existing website, we never need a login to it, and nothing is installed into it.
        </p>

        <ol className="pd-steps">
          {PD_SETUP.map((s) => (
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
          <dt>Can my referrers see each other's deals?</dt>
          <dd>
            Never. Each partner sees only the deals they referred. It is enforced in the
            database itself, not by hiding things on screen. Switch between partners on the
            demo board and watch the rows disappear.
          </dd>

          <dt>Does this replace my CRM?</dt>
          <dd>
            No. Your CRM is where you work. This is the window your referral partners look
            through, so they stop ringing you for updates. You keep whatever you already use.
          </dd>

          <dt>My pipeline does not look like your demo.</dt>
          <dd>
            The stages are yours to set. The demo shows four completely different pipelines
            across four different kinds of referrer, and none of them share a stage list.
          </dd>

          <dt>What about my clients' privacy?</dt>
          <dd>
            Data is held in Australia, encrypted, and separated per firm at the database
            level. Your partners see only their own referrals. You get a written data
            processing agreement before anything goes live.
          </dd>

          <dt>What if a referral relationship ends?</dt>
          <dd>
            Switch their portal off. Their access dies immediately, the deals stay on your
            board, and your bill drops the following month.
          </dd>

          <dt>Can my partners submit new referrals through it?</dt>
          <dd>
            That is next on the build list. Today they watch; shortly they will be able to
            lodge a referral straight onto your board.
          </dd>
        </dl>
      </section>
    </div>
  );
}

// ---- demo control bar ---------------------------------------------------
//
// Deliberately styled as scaffolding rather than product chrome, so a prospect
// never mistakes it for something their referrers would see. Josh drives the
// whole demo from this one bar.

function PdDemoBar({ scenario, onScenario, viewer, onViewer, partners, onReset, dirty, mode, onMode }) {
  return (
    <div className="pd-bar">
      <div className="pd-bar-inner">
        <div className="pd-bar-group">
          <span className="pd-bar-label">View</span>
          <div className="pd-seg">
            <button type="button" className={`pd-seg-btn${mode === 'board' ? ' is-on' : ''}`}
                    onClick={() => onMode('board')}>The board</button>
            <button type="button" className={`pd-seg-btn${mode === 'pricing' ? ' is-on' : ''}`}
                    onClick={() => onMode('pricing')}>Pricing &amp; setup</button>
          </div>
        </div>

        <div className="pd-bar-group" hidden={mode !== 'board'}>
          <span className="pd-bar-label">Referrer type</span>
          <div className="pd-seg">
            {PD_SCENARIOS.map((s) => (
              <button key={s.id} type="button"
                      className={`pd-seg-btn${s.id === scenario.id ? ' is-on' : ''}`}
                      onClick={() => onScenario(s.id)}>
                {s.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="pd-bar-group" hidden={mode !== 'board'}>
          <span className="pd-bar-label">Signed in as</span>
          <div className="pd-seg">
            <button type="button"
                    className={`pd-seg-btn${viewer === 'staff' ? ' is-on' : ''}`}
                    onClick={() => onViewer('staff')}>
              Broker staff
            </button>
            {partners.map((p) => (
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

function PdRow({ deal, scenario, canEdit, open, onToggle, onStage, onNote }) {
  const [noteText, setNoteText] = useStatePd('');
  const tone = pdTone(deal.stage);
  const notes = deal.notes;
  const latest = notes[0];

  const submitNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onNote(deal.id, noteText.trim());
    setNoteText('');
  };

  return (
    <React.Fragment>
      <tr className={`board-row${open ? ' is-open' : ''}`}>
        <td className="board-cell board-cell-vehicle" data-label={scenario.itemLabel}>
          <button type="button" className="board-vehicle-btn" aria-expanded={open} onClick={onToggle}>
            <span className="board-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
            <span className="board-vehicle">{deal.item}</span>
          </button>
          <span className="board-vehicle-sub">
            {deal.sub.filter(Boolean).map((s, i) => <span key={i}>{s}</span>)}
          </span>
        </td>

        <td className="board-cell board-cell-name" data-label={scenario.customerLabel}>{deal.customer}</td>

        <td className="board-cell board-cell-phone" data-label="Phone">
          <a href={pdTel(deal.phone)}>{deal.phone}</a>
        </td>

        <td className="board-cell board-cell-note" data-label="Latest note">
          {latest ? (
            <React.Fragment>
              <span className="board-note-text">{latest.t}</span>
              <span className="board-note-when">{pdWhen(latest.w)}{latest.by ? ` · ${latest.by}` : ''}</span>
            </React.Fragment>
          ) : <span className="board-blank">No notes yet</span>}
        </td>

        {/* Staff drive the board from here. A partner reads it. In the real
            product this is enforced by row-level security in Postgres, not by
            hiding the control. */}
        <td className="board-cell board-cell-status" data-label="Status">
          {canEdit ? (
            <select className={`board-status-select tone-${tone}`} value={deal.stage}
                    aria-label={`Stage for ${deal.item}`}
                    onChange={(e) => onStage(deal.id, e.target.value)}>
              {scenario.stages.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <p className="deal-updated">Last updated: {pdWhen(deal.updated)}</p>
                <p className="deal-updated">Referred by: {deal.partnerName}</p>
              </div>

              <ol className="deal-history">
                {notes.map((n, i) => (
                  <li key={i}>
                    <p className="deal-note-when">{pdWhen(n.w)}</p>
                    <p className="deal-note-text">{n.t}</p>
                    {n.by && <p className="deal-note-who">by {n.by}</p>}
                  </li>
                ))}
              </ol>

              {canEdit && (
                <div className="deal-staff-tools">
                  <form onSubmit={submitNote} className="deal-note-form">
                    <label htmlFor={`pd-note-${deal.id}`} className="deal-label">Add an update</label>
                    <textarea id={`pd-note-${deal.id}`} rows={2} value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Customer has supplied bank statements…" />
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

function PdGroup({ stage, deals, scenario, collapsed, onToggleGroup, openIds, onToggleRow, ...rowProps }) {
  const tone = pdTone(stage);
  const headingId = `pd-group-${stage.replace(/\s+/g, '-').toLowerCase()}`;

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
                <th scope="col" className="board-cell-vehicle">{scenario.itemLabel}</th>
                <th scope="col" className="board-cell-name">{scenario.customerLabel}</th>
                <th scope="col" className="board-cell-phone">Phone</th>
                <th scope="col" className="board-cell-note">Latest note</th>
                <th scope="col" className="board-cell-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <PdRow key={d.id} deal={d} scenario={scenario} {...rowProps}
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

function PortalDemoPage() {
  pdNoIndex();

  const [mode, setMode] = useStatePd('board');            // 'board' | 'pricing'
  const [scenarioId, setScenarioId] = useStatePd(PD_SCENARIOS[0].id);
  const [viewer, setViewer] = useStatePd('staff');
  const [overrides, setOverrides] = useStatePd({});   // dealId -> { stage, notes }
  const [openIds, setOpenIds] = useStatePd(() => new Set());
  const [collapsed, setCollapsed] = useStatePd(() => new Set());

  const scenario = useMemoPd(
    () => PD_SCENARIOS.find((s) => s.id === scenarioId) || PD_SCENARIOS[0],
    [scenarioId],
  );

  useEffectPd(() => {
    document.title = 'Referral Partner Portal — demo';
  }, []);

  // Switching vertical resets the viewer: a partner id from one scenario is
  // meaningless in another, and landing on the staff view is the right place
  // to start the next part of the pitch anyway.
  const changeScenario = (id) => {
    setScenarioId(id);
    setViewer('staff');
    setOpenIds(new Set());
    setCollapsed(new Set());
  };

  const reset = () => {
    setOverrides({});
    setOpenIds(new Set());
  };

  // Seed data merged with anything changed during the demo.
  const allDeals = useMemoPd(() => scenario.deals.map((d) => {
    const o = overrides[d.id] || {};
    const partner = scenario.partners.find((p) => p.id === d.partner);
    return {
      ...d,
      stage: o.stage || d.stage,
      notes: o.notes || d.notes,
      updated: o.updated || d.updated,
      partnerName: partner ? partner.name : '',
    };
  }), [scenario, overrides]);

  const isStaff = viewer === 'staff';
  const activePartner = isStaff ? null : scenario.partners.find((p) => p.id === viewer);

  // The whole point of the demo. A partner sees only their own referrals, and
  // the count in the header makes the other rows' absence explicit rather than
  // something the prospect has to take on faith.
  const visible = isStaff ? allDeals : allDeals.filter((d) => d.partner === viewer);

  const grouped = useMemoPd(() => {
    const out = [];
    for (const stage of scenario.stages) {
      const rows = visible.filter((d) => d.stage === stage);
      if (rows.length) out.push({ stage, rows });
    }
    return out;
  }, [scenario, visible]);

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

  const dirty = Object.keys(overrides).length > 0;

  return (
    <div className="deal-shell pd-shell" style={{ '--pd-accent': scenario.broker.accent }}>
      <PdDemoBar
        scenario={scenario}
        onScenario={changeScenario}
        viewer={viewer}
        onViewer={setViewer}
        partners={scenario.partners}
        onReset={reset}
        dirty={dirty}
        mode={mode}
        onMode={setMode}
      />

      {mode === 'pricing' && (
        <div className="deal-page">
          <PdPricing />
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
        <strong>{scenario.tab}.</strong> {scenario.blurb}
      </div>

      <div className="deal-page">
        {/* The broker's own branding on the broker's own domain. This header is
            the answer to "so it sits on my website?" */}
        <header className="pd-brandbar">
          <div className="pd-brand">
            <span className="pd-brand-mark">{scenario.broker.initials}</span>
            <span className="pd-brand-text">
              <span className="pd-brand-name">{scenario.broker.name}</span>
              <span className="pd-brand-domain">{scenario.broker.domain}</span>
            </span>
          </div>
          <div className="pd-whoami">
            {isStaff ? (
              <React.Fragment>
                <span className="deal-role">Broker staff</span>
                <span className="pd-whoami-sub">Full access · all referral partners</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span className="deal-role">{activePartner.name}</span>
                <span className="pd-whoami-sub">Signed in as {activePartner.signedInAs} · view only</span>
              </React.Fragment>
            )}
          </div>
        </header>

        <div className="pd-scope">
          {isStaff ? (
            <React.Fragment>
              Showing <strong>all {allDeals.length} deals</strong> across{' '}
              <strong>{scenario.partners.length} referral partners</strong>. Change a stage or add a
              note and the partner sees it immediately.
            </React.Fragment>
          ) : (
            <React.Fragment>
              Showing <strong>{visible.length} of {allDeals.length} deals</strong>. {activePartner.name}{' '}
              can only ever see the {visible.length} they referred. The other{' '}
              {allDeals.length - visible.length} belong to different partners and are invisible here.
            </React.Fragment>
          )}
        </div>

        {grouped.length === 0 ? (
          <p className="deal-empty">No deals on this board yet.</p>
        ) : (
          grouped.map(({ stage, rows }) => (
            <PdGroup
              key={stage}
              stage={stage}
              deals={rows}
              scenario={scenario}
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
            Demonstration only. Every name, number and deal on this page is invented.
            No real customer information is stored or displayed.
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
