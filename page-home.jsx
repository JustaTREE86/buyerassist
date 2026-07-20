/* global React, PHOTOS, LOANS, Icon, LogoExisting, LogoProposed, formatMoney, repaymentPerWeek, SocialIcon, afosLink */
const { useState: useStateHome, useMemo: useMemoHome, useEffect: useEffectHome } = React;

// Set a Formspree endpoint to receive partner enquiries by email:
// https://formspree.io — free tier. Leave '' to use mailto fallback.
const PARTNER_FORM_ENDPOINT = '';

// =============================================================
// Hero (3 variants)
// =============================================================
function Hero({ variant, palette, onNavigate }) {
  const variantClass = variant === 'split' ? 'split' : variant === 'editorial' ? 'editorial' : variant === 'portrait' ? 'portrait' : '';

  if (variant === 'portrait') {
    return (
      <section className={`hero ${variantClass}`}>
        <div className="container hero-inner">
          <div className="portrait-grid">
            <div className="pt-copy">
              <div className="eyebrow"><span className="dot"></span>Bespoke loan solutions · Australia-wide</div>
              <h1 className="display">
                <em>Bespoke</em><br />
                finance,<br />
                quietly done<br />
                well.
              </h1>
              <p className="hero-sub">
                A boutique brokerage, founded in Brisbane, advising individuals and small business owners across Australia. A dedicated team. Fifty-plus lenders. A loan tailored to you, not to a panel.
              </p>
              <div className="hero-cta">
                <a className="btn primary" onClick={() => onNavigate('apply')}>Begin your application <span className="arrow">→</span></a>
                <a className="btn ghost" onClick={() => onNavigate('about')}>Meet the team</a>
              </div>
            </div>
            <div className="pt-photo">
              <span className="pt-corner"></span>
              <span className="pt-corner br"></span>
              <img src={PHOTOS.leonie} alt="Leonie, Director, The Buyer Assist Group"/>
              <div className="pt-caption">
                <span className="role">Director · The Buyer Assist Group</span>
                <span className="who">Leonie</span>
              </div>
            </div>
          </div>
        </div>
        <HeroStrip />
      </section>
    );
  }

  if (variant === 'editorial') {
    return (
      <section className={`hero ${variantClass}`}>
        <div className="hero-media">
          <img src={PHOTOS.heroCoast} alt="" />
        </div>
        <div className="container hero-inner">
          <div className="eyebrow on-dark"><span className="dot"></span>Brisbane · Australia-wide</div>
          <h1 className="display" style={{ marginTop: 24 }}>
            Finance,<br />
            <em>quietly</em><br />
            done well.
          </h1>
          <p className="hero-sub" style={{ maxWidth: 520, marginTop: 32 }}>
            A boutique brokerage for individuals and SMEs. Fifty-plus lenders, a dedicated team behind your file, and the honesty to tell you when the answer is no.
          </p>
          <div className="hero-cta">
            <a className="btn primary" onClick={() => onNavigate('apply')}>Start an application <span className="arrow">→</span></a>
            <a className="btn ghost on-dark" onClick={() => onNavigate('services')}>View loan products</a>
          </div>
        </div>
        <HeroStrip />
      </section>);

  }

  if (variant === 'split') {
    return (
      <section className={`hero ${variantClass}`}>
        <div className="hero-media">
          <img src={PHOTOS.heroCar} alt="" />
        </div>
        <div className="container hero-inner">
          <div className="hero-grid">
            <div>
              <div className="eyebrow on-dark"><span className="dot"></span>Bespoke loan solutions</div>
              <h1 className="display" style={{ marginTop: 24 }}>
                The shortest line<br />between you<br />and <em>yes.</em>
              </h1>
              <p className="hero-sub">
                Cars, caravans, commercial fit-outs, medical kit, the next van for the business, financed through 50+ lenders and a team you can trust.
              </p>
              <div className="hero-cta">
                <a className="btn primary" onClick={() => onNavigate('apply')}>Get pre-approved <span className="arrow">→</span></a>
                <a className="btn ghost on-dark" onClick={() => onNavigate('services')}>What we finance</a>
              </div>
            </div>
          </div>
        </div>
        <HeroStrip />
      </section>);

  }

  // Default: cinematic
  return (
    <section className={`hero ${variantClass}`}>
      <div className="hero-media">
        <img src={PHOTOS.heroCoast} alt="" />
      </div>
      <div className="container hero-inner">
        <div className="hero-grid">
          <div>
            <div className="eyebrow on-dark"><span className="dot"></span>Bespoke loan solutions · Australia-wide</div>
            <h1 className="display" style={{ marginTop: 24 }}>
              Finance<br />
              built around<br />
              <em>your life.</em>
            </h1>
            <p className="hero-sub">
              A concierge brokerage for individuals and small business owners across Australia. We match the loan to the human — not the other way around.
            </p>
            <div className="hero-cta">
              <a className="btn primary" onClick={() => onNavigate('apply')}>Get pre-approved <span className="arrow">→</span></a>
              <a className="btn ghost on-dark" onClick={() => onNavigate('about')}>Our approach</a>
            </div>
          </div>
          <div className="hero-meta">
            <div className="hero-stat">
              <span className="num">50<sup>+</sup></span>
              <span className="lbl">Trusted lenders</span>
            </div>
            <div className="hero-stat">
              <span className="num">24h</span>
              <span className="lbl">Avg. pre-approval</span>
            </div>
            <div className="hero-stat">
              <span className="num">0%</span>
              <span className="lbl">Impact to your credit score for a quote</span>
            </div>
          </div>
        </div>
      </div>
      <HeroStrip />
    </section>);

}

function HeroStrip() {
  const vals = [
    { n: 'i.', word: 'Honesty', copy: 'A "no" from us is more useful than a slow "yes" from anyone else.' },
    { n: 'ii.', word: 'Transparency', copy: 'Every commission, every fee, every reason — on the same page as the rate.' },
    { n: 'iii.', word: 'Confidence', copy: 'We\'ve placed thousands of files. We know who says yes and why.' },
    { n: 'iv.', word: 'Experience', copy: 'Decades across asset, commercial, and the niches that need attention.' },
  ];
  return (
    <div className="hero-values">
      <div className="container">
        <div className="hero-values-grid">
          {vals.map(v => (
            <div className="hero-value" key={v.word}>
              <span className="hv-roman">{v.n}</span>
              <span className="hv-word">{v.word}</span>
              <p className="hv-copy">{v.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================
// Products grid
// =============================================================
function Products({ onNavigate }) {
  return (
    <section className="section paper" id="services">
      <div className="container" style={{ marginBottom: 64 }}>
        <div className="row-between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ maxWidth: 720 }}>
            <div className="eyebrow"><span className="dot"></span>What we finance</div>
            <h2 className="h1" style={{ marginTop: 16 }}>
              Eight products.<br />One <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>honest</em> conversation.
            </h2>
          </div>
          <p className="lede" style={{ maxWidth: 460, color: 'var(--muted)' }}>
            Whatever you're financing, we shop your file across fifty-plus lenders and bring back the option that actually suits you.
          </p>
        </div>
      </div>
      <div className="container">
        <div className="products-grid">
          {LOANS.map((loan) => {
            const isCredit = loan.id === 'credit';
            if (isCredit) {
              return (
                <div className="product" key={loan.id} onClick={() => onNavigate('credit-repair')}>
                  <div className="icon"><Icon name={loan.icon} size={36} /></div>
                  <span className="num">{loan.roman}</span>
                  <h3 className="name">{loan.name}</h3>
                  <p className="desc">{loan.desc}</p>
                  <span className="arrow">Learn more</span>
                </div>
              );
            }
            return (
            <a className="product" key={loan.id} href={afosLink(loan.id)}>
              <div className="icon"><Icon name={loan.icon} size={36} /></div>
              <span className="num">{loan.roman}</span>
              <h3 className="name">{loan.name}</h3>
              <p className="desc">{loan.desc}</p>
              <span className="arrow">Apply</span>
            </a>
            );
          })}
          <div className="product" style={{ background: 'var(--ink)', color: 'var(--cream)' }} onClick={() => onNavigate('apply')}>
            <div className="icon" style={{ color: 'var(--gold)' }}><Icon name="arrow" size={36} /></div>
            <span className="num" style={{ color: 'var(--gold-soft)' }}>IX</span>
            <h3 className="name">Not sure where you fit?</h3>
            <p className="desc" style={{ color: 'rgba(245,241,232,0.72)' }}>Tell us what you're after in plain English. We'll figure out the right product — that's the job.</p>
            <span className="arrow" style={{ color: 'var(--gold-soft)' }}>Talk to a broker</span>
          </div>
        </div>
      </div>
    </section>);

}

// =============================================================
// Calculator
// =============================================================
function Calculator() {
  const [amount, setAmount] = useStateHome(45000);
  const [years, setYears] = useStateHome(5);
  const [type, setType] = useStateHome('car');
  const rates = { car: 6.49, personal: 9.89, commercial: 7.99, business: 8.49 };
  const rate = rates[type] || 6.99;
  const weekly = useMemoHome(() => repaymentPerWeek(amount, rate, years), [amount, rate, years]);
  const totalInterest = weekly * 52 * years - amount;

  return (
    <section className="section paper">
      <div className="container">
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="eyebrow"><span className="dot"></span>Rate Quote</div>
          <h2 className="h1" style={{ marginTop: 16 }}>
            See your number.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>No credit check</em> required.
          </h2>
        </div>
        <div className="calc-wrap">
          <div className="calc-grid">
            <div className="calc-left">
              <div className="eyebrow on-dark">Step 01 — Indicative quote</div>
              <div className="calc-field">
                <label>Loan type</label>
                <div className="calc-chips">
                  {['car', 'personal', 'commercial', 'business'].map((t) =>
                  <button key={t} className={`calc-chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                      {t === 'car' ? 'Asset / Car' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  )}
                </div>
              </div>
              <div className="calc-field">
                <label>Amount</label>
                <div className="control">
                  <span style={{ color: 'var(--gold-soft)', fontFamily: 'var(--serif)', fontSize: 32 }}>$</span>
                  <input value={formatMoney(amount)} onChange={(e) => setAmount(Number(e.target.value.replace(/,/g, '')) || 0)} />
                </div>
                <input type="range" min="5000" max="250000" step="1000" value={amount} className="calc-slider" onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div className="calc-field">
                <label>Term</label>
                <div className="calc-chips">
                  {[2, 3, 5, 7].map((y) =>
                  <button key={y} className={`calc-chip ${years === y ? 'active' : ''}`} onClick={() => setYears(y)}>{y} years</button>
                  )}
                </div>
              </div>
            </div>
            <div className="calc-right">
              <div className="calc-result">
                <span className="label">Indicative repayment</span>
                <div className="repay">
                  ${formatMoney(Math.floor(weekly))}<span className="cents">.{String(Math.round(weekly % 1 * 100)).padStart(2, '0')}</span>
                </div>
                <span className="per">per week · from {rate.toFixed(2)}% p.a. comparison</span>
              </div>
              <div className="calc-breakdown">
                <div className="row"><span className="k">Loan amount</span><span className="v">${formatMoney(amount)}</span></div>
                <div className="row"><span className="k">Term</span><span className="v">{years} years</span></div>
                <div className="row"><span className="k">Total interest (est.)</span><span className="v">${formatMoney(Math.max(0, totalInterest))}</span></div>
                <div className="row"><span className="k">Establishment fee</span><span className="v">$0</span></div>
              </div>
              <a className="btn primary" style={{ marginTop: 24, alignSelf: 'flex-start' }} href={afosLink(type)}>Lock this rate in <span className="arrow">→</span></a>
            </div>
          </div>
        </div>
        <p className="body" style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          Indicative only. Final rate depends on lender, credit profile, and security. No credit check performed for a quote.
        </p>
      </div>
    </section>);

}

// =============================================================
// Process
// =============================================================
function Process({ onNavigate }) {
  const steps = [
  { n: '01', t: 'Tell us your story', b: 'Three minutes of basic info — no credit check, no commitment, no hard sell.' },
  { n: '02', t: 'Send the paperwork', b: 'Upload payslips, ID, and any business documents through our secure portal.' },
  { n: '03', t: 'We do the shopping', b: 'We file your application across the right lenders and negotiate on your behalf.' },
  { n: '04', t: 'Sign & settle', b: 'Pre-approval in 24 hours, settlement coordinated with the dealership or supplier.' }];

  return (
    <section className="section cream">
      <div className="container">
        <div className="row-between" style={{ alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="eyebrow"><span className="dot"></span>How it works</div>
            <h2 className="h1" style={{ marginTop: 16 }}>A simple, <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>thorough</em> process.</h2>
          </div>
          <a className="btn ghost" onClick={() => onNavigate('apply')}>Begin yours <span className="arrow">→</span></a>
        </div>
        <div className="steps">
          {steps.map((s) =>
          <div className="step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.t}</div>
              <div className="step-body">{s.b}</div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// =============================================================
// Lender marquee
// =============================================================
const LENDER_LOGOS = [
  { name: 'ANZ', src: '/assets/lenders/ANZ_NewPacific_H_RGB.png' },
  { name: 'Westpac', src: '/assets/lenders/Westpac_W Logo_col_RGB.png' },
  { name: 'Commonwealth Bank', src: '/assets/lenders/CommBank landscape.png' },
  { name: 'BOQ Finance', src: '/assets/lenders/BOQ_Finance_RGB 1.png' },
  { name: 'Judo Bank', src: '/assets/lenders/judo-bank.png' },
  { name: 'Liberty', src: '/assets/lenders/Liberty.png' },
  { name: 'Pepper Money', src: '/assets/lenders/pepper-money-logo.png' },
  { name: 'Latitude', src: '/assets/lenders/Latitude_primary-logo_indigo_RGB.png' },
  { name: 'Wisr', src: '/assets/lenders/WISR.png' },
  { name: 'MoneyMe', src: '/assets/lenders/MONEYME-logo.png' },
  { name: 'Money3', src: '/assets/lenders/money3-logo_colour_RGB_lge.jpg' },
  { name: 'Lumi', src: '/assets/lenders/lumi-h-screen.png' },
  { name: 'Banjo', src: '/assets/lenders/banjo-logo.png' },
  { name: 'ScotPac', src: '/assets/lenders/scotpaclogo.png' },
  { name: 'Resimac', src: '/assets/lenders/Resimac.png' },
  { name: 'Firstmac', src: '/assets/lenders/Firstmac.png' },
  { name: 'Capital Finance', src: '/assets/lenders/Capital Finance.png' },
  { name: 'Shift', src: '/assets/lenders/Shift Logo.png' },
  { name: 'Dynamoney', src: '/assets/lenders/Dynamoney.png' },
  { name: 'Metro Finance', src: '/assets/lenders/Metro_Logo_Screen_Landscape_Navy_RGB.png' },
  { name: 'Azora', src: '/assets/lenders/Azora_logo_CMYK@2x.png' },
  { name: 'Maple', src: '/assets/lenders/maple_landscape_navy.svg' },
  { name: 'Vestone Capital', src: '/assets/lenders/Vestone Capital.png' },
  { name: 'Selfco', src: '/assets/lenders/Selfco NEW LOGO.jpg' },
  { name: 'FinanceOne', src: '/assets/lenders/Financeone .png' },
  { name: 'SocietyOne', src: '/assets/lenders/SocietyOne.png' },
  { name: 'Sonder', src: '/assets/lenders/Sonder Equipment Finance Logo.png' },
  { name: 'Capify', src: '/assets/lenders/capify-logo-color (2).png' },
  { name: 'AFS', src: '/assets/lenders/AFS_Logo_CMYK_Blue.png' },
  { name: 'Angle Finance', src: '/assets/lenders/Angle Finance HQ.png' },
  { name: 'RACV', src: '/assets/lenders/RACV_Logo_CMYK.jpg' },
  { name: 'Resimac Asset Finance', src: '/assets/lenders/Resimac Asset Finance logo.png' },
];

const MAJOR_LENDER_LOGOS = LENDER_LOGOS.filter(l => [
  'ANZ', 'Westpac', 'Commonwealth Bank', 'Judo Bank', 'Liberty',
  'Pepper Money', 'Latitude', 'Wisr', 'MoneyMe', 'ScotPac',
].includes(l.name));

function LenderPanelRotator() {
  const [i, setI] = useStateHome(0);
  useEffectHome(() => {
    const id = setInterval(() => setI(v => (v + 1) % MAJOR_LENDER_LOGOS.length), 2200);
    return () => clearInterval(id);
  }, []);
  const l = MAJOR_LENDER_LOGOS[i];
  return (
    <div className="accred-rotator">
      <img key={l.name} src={l.src} alt={l.name} className="accred-rotator-logo" />
    </div>
  );
}

function Lenders() {
  return (
    <section className="section cream" style={{ padding: '80px 0', borderTop: '1px solid var(--line)' }}>
      <div className="container" style={{ marginBottom: 32 }}>
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow"><span className="dot"></span>Lender panel</div>
            <h2 className="h2" style={{ marginTop: 12 }}>Fifty-plus lenders. One file.</h2>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300 }}>
            We're independent. We work for you, not for the bank with the friendliest BDM.
          </p>
        </div>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {[...LENDER_LOGOS, ...LENDER_LOGOS].map((l, i) => (
            <div className="marquee-item" key={i}>
              <img src={l.src} alt={l.name} className="lender-logo" />
            </div>
          ))}
        </div>
      </div>
    </section>);

}

// =============================================================
// Accreditations strip (placeholder badges)
// =============================================================
function Accreditations() {
  return (
    <section className="section paper" style={{ padding: '64px 0', borderTop: '1px solid var(--line)' }}>
      <div className="container">
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 28 }}>
          <span className="dot"></span>Accredited &amp; independent
        </div>
        <div className="accred-row">
          {ACCREDITATIONS.map(a => (
            <div className="accred-badge" key={a.id}>
              {a.id === 'panel'
                ? <LenderPanelRotator />
                : a.logo
                  ? <img src={a.logo} alt={a.label} className="accred-logo" />
                  : <span className="accred-label">{a.label}</span>
              }
              <span className="accred-sub">{a.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Google reviews banner — sits between the lender strip and the
// accreditation cards. Branding + CTA only: the live rating, review
// count and review text live inside the third-party (LeadConnector /
// Google) reviews widget on the Our Clients page and cannot be read
// cross-origin, so nothing here is fabricated. "Read our Google reviews"
// routes to that page where the verified widget renders in full.
// =============================================================
function GoogleG({ size = 26 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}

function GoogleReviews({ onNavigate }) {
  return (
    <section className="section paper gr-banner" aria-labelledby="gr-title">
      <div className="container">
        <div className="gr-strip">
          <div className="gr-brand">
            <span className="gr-glogo"><GoogleG size={30}/></span>
            <span className="gr-brand-text">
              <span className="eyebrow" style={{ margin: 0 }}><span className="dot"></span>Verified on Google</span>
              <span id="gr-title" className="gr-title">Google Reviews</span>
            </span>
          </div>
          <p className="gr-lede">Real reviews from clients we've looked after, published on our Google Business profile.</p>
          <button type="button" className="btn primary gr-cta" onClick={() => onNavigate('clients')}>
            Read our Google reviews <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Pillars (Honesty, Transparency, Confidence, Experience)
// =============================================================
function Pillars() {
  const pillars = [
  { label: 'i', word: 'Honesty', copy: 'If a loan isn\'t right for you, we say so. Even if it costs us the commission.' },
  { label: 'ii', word: 'Transparency', copy: 'Every fee, every commission, every reason a lender said yes or no. Written down.' },
  { label: 'iii', word: 'Confidence', copy: 'We negotiate on your behalf with the conviction of brokers who have done this thousands of times.' },
  { label: 'iv', word: 'Experience', copy: 'Decades across asset finance, commercial lending, and the niches that pay attention to detail.' }];

  return (
    <section className="section dark">
      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div className="eyebrow on-dark"><span className="dot"></span>The four corners</div>
          <h2 className="h1" style={{ marginTop: 16, color: 'var(--cream)' }}>
            Four words<br />
            we <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>stake</em> the practice on.
          </h2>
        </div>
        <div className="pillars">
          {pillars.map((p) =>
          <div className="pillar" key={p.word}>
              <span className="label">{p.label}.</span>
              <h3 className="word">{p.word}</h3>
              <p className="copy">{p.copy}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// =============================================================
// Editorial feature
// =============================================================
function Feature({ onNavigate }) {
  return (
    <section className="section paper">
      <div className="container">
        <div className="feature">
          <div className="feature-media">
            <img src={PHOTOS.creditRepairFeature} alt="The Buyer Assist Group with Larni from Wipe Credit Clean" style={{ objectPosition: 'center 20%' }} />
          </div>
          <div className="feature-copy">
            <div className="eyebrow"><span className="dot"></span>Credit repair · with our partner Wipe Credit Clean</div>
            <h2 className="h2">
              When the answer<br />is "<em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>not yet</em>" —<br />we don't walk away.
            </h2>
            <p className="body" style={{ fontSize: 17, maxWidth: '46ch' }}>
              Some clients need to sort out their credit file before the right loan is within reach. Through our partner Wipe Credit Clean, we help them look into it — credit repair is a separate service, and no outcome is guaranteed.
            </p>
            <div className="cluster">
              <button type="button" className="btn ghost" onClick={() => onNavigate('credit-repair')}>Learn about credit repair <span className="arrow">→</span></button>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

// =============================================================
// CTA footer
// =============================================================
function CTA({ onNavigate }) {
  return (
    <section className="section cream" style={{ padding: 'clamp(80px, 10vw, 140px) 0', borderTop: '1px solid var(--line)' }}>
      <div className="container" style={{ textAlign: 'left' }}>
        <div className="row-between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 32 }}>
          <h2 className="display" style={{ maxWidth: '14ch', fontSize: 'clamp(48px, 7vw, 96px)' }}>
            Let's talk about <em>your</em> next move.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <span className="eyebrow">Direct line</span>
            <a className="h2" style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(28px, 3vw, 40px)' }} href="tel:0756131905">07 5613 1905</a>
            <div className="cluster" style={{ marginTop: 16 }}>
              <a className="btn primary" onClick={() => onNavigate('apply')}>Apply online <span className="arrow">→</span></a>
              <a className="btn ghost" href="mailto:connect@thebuyerassist.com.au">Email a broker</a>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

// =============================================================
// Bespoke / Founder block — featuring Leonie
// =============================================================
function BespokeBlock({ onNavigate }) {
  return (
    <section className="section paper" style={{ paddingTop: 'clamp(60px, 8vw, 100px)', paddingBottom: 'clamp(60px, 8vw, 100px)' }}>
      <div className="container">
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="eyebrow"><span className="dot"></span>The practice</div>
          <h2 className="h1" style={{ marginTop: 16 }}>
            One word we<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>actually</em> mean.
          </h2>
        </div>
        <div className="bespoke-block">
          <header className="bb-header">
            <h3 className="bb-word">
              <span>Be<span className="accent">·</span>spoke</span>
              <span className="bb-adj">adj.</span>
            </h3>
            <span className="bb-pron">/ b<span style={{ fontStyle: 'normal' }}>ɪ</span>ˈspoʊk /</span>
          </header>
          <div className="bb-media">
            <span className="bb-stamp">Leonie · Director</span>
            <img src={PHOTOS.leonieBespoke} alt="Leonie, Director, The Buyer Assist Group" />
          </div>
          <div className="bb-copy">
            <div className="bb-def">
              <p className="meaning">
                <em style={{ color: 'var(--gold-2)' }}>Made for one person.</em> Cut to their measurements, written in their language, weighed against the life they're actually living.
              </p>
            </div>
            <p className="body" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: '44ch' }}>
              We've spent years being told finance is a numbers game. It isn't. It's a story game, and the team that reads your file the most carefully wins the best rate. That's the entire job, done quietly, file by file.
            </p>
            <div className="bb-signature">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="sig-name">— Leonie</span>
                <span className="sig-role">Director · The Buyer Assist Group</span>
              </div>
              <a className="btn link" style={{ marginLeft: 'auto' }} onClick={() => onNavigate('about')}>Read our story →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// HomePage
// =============================================================
function HomePage({ heroVariant, palette, onNavigate }) {
  return (
    <main data-screen-label="01 Home">
      <Hero variant={heroVariant} palette={palette} onNavigate={onNavigate} />
      <Products onNavigate={onNavigate} />
      <Calculator />
      <Process onNavigate={onNavigate} />
      <Lenders />
      <GoogleReviews onNavigate={onNavigate} />
      <Accreditations />
      <BespokeBlock onNavigate={onNavigate} />
      <Pillars />
      <Feature onNavigate={onNavigate} />
      <CTA onNavigate={onNavigate} />
    </main>);

}

Object.assign(window, { HomePage, Hero, Products, Calculator, Process, Lenders, GoogleReviews, GoogleG, Accreditations, BespokeBlock, Pillars, Feature, CTA, LENDER_LOGOS, MAJOR_LENDER_LOGOS });
