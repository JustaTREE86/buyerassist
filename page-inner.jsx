/* global React, PHOTOS, LOANS, Icon, LogoExisting, LogoProposed, LENDER_LOGOS, BROKERS, SocialIcon, CONTACT, DOC_CHECKLIST, CREDIT_REPAIR_DOCS, NEXT_STEPS, isValidAUPhone, isValidEmail, docsMailto, submitEnquiry */
const { useState: useStateInner } = React;

// Lead delivery is configured in one place: CONTACT.formEndpoint (components.jsx).
// Paste your Formspree endpoint there to email submissions straight to the inbox;
// while it's blank, forms fall back to the visitor's email app so nothing is lost.

// =============================================================
// Page header (shared)
// =============================================================
function PageHead({ eyebrow, title, meta, image }) {
  const style = image ? { '--head-img': `url('${image}')` } : undefined;
  return (
    <section className="page-head" style={style}>
      <div className="container">
        <div className="head-grid">
          <div>
            <div className="eyebrow on-dark"><span className="dot"></span>{eyebrow}</div>
            <h1 className="h1" style={{ color: 'var(--cream)' }} dangerouslySetInnerHTML={{__html: title}} />
          </div>
          <p className="head-meta">{meta}</p>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Services page
// =============================================================
function ServicesPage({ onNavigate }) {
  return (
    <main data-screen-label="02 Services">
      <PageHead
        eyebrow="Loan products · 01 / 04"
        title="Bespoke finance,<br/>matched <em style='font-style:italic;color:var(--gold)'>to the asset.</em>"
        meta="We finance eight categories with the same boutique attention. No call-centre scripts, no panel-fit-the-customer. We start from your situation and work outward."
        image="https://images.unsplash.com/photo-1756805104140-eade12344ef7?w=2000&q=80&auto=format&fit=crop"
      />
      <section className="section paper">
        <div className="container">
          <div className="services-list">
            {LOANS.map(l => (
              <div className="service-row" key={l.id} onClick={() => l.id === 'credit' ? onNavigate('credit-repair') : onNavigate('apply', { loan: l.id })}>
                <span className="svc-num">{l.roman}</span>
                <h3 className="svc-name">{l.name}</h3>
                <p className="svc-desc">{l.desc}</p>
                <span className="svc-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process inset */}
      <section className="section cream">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 48, alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="eyebrow"><span className="dot"></span>What working with us looks like</div>
              <h2 className="h1" style={{ marginTop: 16, maxWidth: '14ch' }}>The brief. Then the work. <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>That's it.</em></h2>
            </div>
          </div>
          <div className="grid-2">
            <div>
              <h3 className="h3">Discovery call</h3>
              <p className="body" style={{ marginTop: 12 }}>A 20-minute conversation, by phone or in our Chermside office. We listen first, ask the questions that matter, and tell you honestly whether we can help.</p>
            </div>
            <div>
              <h3 className="h3">Submission</h3>
              <p className="body" style={{ marginTop: 12 }}>We package your application the way each lender wants to read it. Same documents — better story. That's where decades of broking experience earn the commission.</p>
            </div>
            <div>
              <h3 className="h3">Negotiation</h3>
              <p className="body" style={{ marginTop: 12 }}>Rates aren't fixed numbers. We negotiate margin, term, and fees on your behalf — and we tell you exactly where the lever moved.</p>
            </div>
            <div>
              <h3 className="h3">Settlement</h3>
              <p className="body" style={{ marginTop: 12 }}>We coordinate with the dealership, supplier, or vendor directly. You sign once, drive away, settle the books. Done.</p>
            </div>
          </div>
        </div>
      </section>

      <CTA onNavigate={onNavigate}/>
    </main>
  );
}

// =============================================================
// About page
// =============================================================
function AboutPage({ onNavigate }) {
  return (
    <main data-screen-label="03 About">
      <PageHead
        eyebrow="About · 02 / 04"
        title="A bespoke practice,<br/>built on a <em style='font-style:italic;color:var(--gold)'>handshake.</em>"
        meta="Founded in Brisbane and led by Leonie, our Director. A boutique team by design. We're the brokerage you call when you're tired of being a customer number."
        image="https://images.unsplash.com/photo-1756805115188-d72c077932fb?w=2000&q=80&auto=format&fit=crop"
      />

      {/* Founders / story */}
      <section className="section paper">
        <div className="container">
          <div className="feature flip">
            <div className="feature-media" style={{ aspectRatio: '4 / 5' }}>
              <img src={PHOTOS.leonieDirector} alt="Leonie, Director of The Buyer Assist Group" style={{ objectPosition: 'center 20%' }}/>
            </div>
            <div className="feature-copy">
              <div className="eyebrow"><span className="dot"></span>From the Director · Leonie</div>
              <h2 className="h2">"Seventeen years in the automotive industry taught me how rarely people are told the <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>truth.</em>"</h2>
              <p className="body" style={{ fontSize: 17 }}>
                The Buyer Assist Group started with one belief: that everyone, the young couple buying their first car, the dentist financing a new chair, the cafe owner growing into a second shopfront, deserves a team who reads their file like it's the only file that day.
              </p>
              <p className="body" style={{ fontSize: 17 }}>
                Bespoke isn't a buzzword for us. It's the entire posture. We're small on purpose. We answer our own phones. We say no when no is the right answer. And when yes is on the table, we negotiate until it's the best yes available.
              </p>
              <div className="cluster" style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--gold-2)' }}>— Leonie</span>
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginLeft: 12 }}>Director · The Buyer Assist Group</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section cream">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 640 }}>
            <div className="eyebrow"><span className="dot"></span>Operating principles</div>
            <h2 className="h1" style={{ marginTop: 16 }}>What clients are <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>actually</em> buying.</h2>
          </div>
          <div className="values-list">
            <div className="value">
              <span className="roman">i.</span>
              <span className="word">Honesty</span>
              <p className="desc">A "no" from us is more useful than a slow "yes" from anyone else.</p>
            </div>
            <div className="value">
              <span className="roman">ii.</span>
              <span className="word">Transparency</span>
              <p className="desc">Every commission, every fee, every reason — on the same page as the rate.</p>
            </div>
            <div className="value">
              <span className="roman">iii.</span>
              <span className="word">Confidence</span>
              <p className="desc">We've placed thousands of files. We know who says yes and why.</p>
            </div>
            <div className="value">
              <span className="roman">iv.</span>
              <span className="word">Experience</span>
              <p className="desc">Decades across asset, commercial, and the niches that need attention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section paper">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 48, alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="eyebrow"><span className="dot"></span>The brokers</div>
              <h2 className="h1" style={{ marginTop: 16 }}>Small team.<br/><em style={{fontStyle:'italic', color:'var(--gold-2)'}}>Direct</em> lines.</h2>
            </div>
            <p className="lede" style={{ maxWidth: 420, color: 'var(--muted)' }}>You'll work with the same broker from first call to settlement. Always.</p>
          </div>
          <div className="team-grid">
            {BROKERS.map(b => (
              <div className="team-card team-card-link" key={b.id} onClick={() => onNavigate('broker', { id: b.id })} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onNavigate('broker', { id: b.id })}>
                <div className="photo">
                  <span className="tag">{b.tag}</span>
                  <img src={PHOTOS[b.photo]} alt={b.name} style={{ objectPosition: 'center top' }}/>
                  <span className="team-card-cta">View profile →</span>
                </div>
                <div className="name">{b.name}</div>
                <div className="role">{b.role}</div>
                <div className="team-card-contact">
                  <a href={`mailto:${b.email}`} onClick={e => e.stopPropagation()}>{b.email}</a>
                  {(b.linkedin || b.instagram || b.facebook) && (
                    <div className="team-card-socials">
                      {b.linkedin && <a href={b.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="LinkedIn"><SocialIcon name="linkedin" size={16}/></a>}
                      {b.instagram && <a href={b.instagram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Instagram"><SocialIcon name="instagram" size={16}/></a>}
                      {b.facebook && <a href={b.facebook} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Facebook"><SocialIcon name="facebook" size={16}/></a>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers strip */}
      <section className="section dark" style={{ padding: 'clamp(60px, 8vw, 100px) 0' }}>
        <div className="container">
          <div className="grid-stats-4">
            {[
              { n: '50+', l: 'Lenders on panel' },
              { n: '24h', l: 'Average pre-approval' },
              { n: '8', l: 'Loan products' },
              { n: '$0', l: 'Cost for a quote' },
            ].map((s) => (
              <div key={s.l}>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.95, color: 'var(--gold)' }}>{s.n}</span>
                <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,232,0.66)' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA onNavigate={onNavigate}/>
    </main>
  );
}

// =============================================================
// Apply page (multi-step form)
// =============================================================
function ApplyPage({ initialLoan, referralSource, enquiryType, onNavigate }) {
  // Debt-consolidation enquiries arrive pre-set from the Debt Busters partner
  // card; they carry a referral source so the notification is identifiable.
  const isDebtConsolidation = initialLoan === 'debt-consolidation';
  const [step, setStep] = useStateInner(initialLoan ? 1 : 0);
  const [data, setData] = useStateInner({
    loan: initialLoan || null,
    amount: 45000,
    term: '',
    purpose: isDebtConsolidation ? 'Debt consolidation' : '',
    name: '',
    email: '',
    phone: '',
    employment: '',
    income: '',
    consent: false,
    company: '', // honeypot — real users leave this empty
  });
  const [error, setError] = useStateInner('');
  const [sending, setSending] = useStateInner(false);
  // Stable reference — generated once, not on every re-render, so it matches
  // the number the client is told to quote when they email their documents.
  const [reference] = useStateInner(() => 'BAG-' + Math.floor(Math.random() * 9000 + 1000));

  // Credit repair is a separate enquiry, never a finance application — if it
  // ever arrives here, redirect to the dedicated credit repair form.
  React.useEffect(() => {
    if (initialLoan === 'credit') onNavigate('credit-repair-enquiry');
  }, [initialLoan]);

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));

  const loanName = isDebtConsolidation
    ? 'Debt Consolidation'
    : (LOANS.find(l => l.id === data.loan) || {}).name || data.loan || 'General enquiry';

  const submitApplication = async () => {
    if (sending) return; // guard against double-submit
    // Validate the essentials so a broker can actually call the lead back.
    if (!data.name.trim()) { setError('Please enter your full name.'); return; }
    if (!isValidAUPhone(data.phone)) { setError('Please enter a valid Australian mobile or phone number.'); return; }
    if (!isValidEmail(data.email)) { setError('Please enter a valid email address so your broker can reach you.'); return; }
    if (!data.consent) { setError('Please confirm you accept the Privacy Policy so we can act on your enquiry.'); return; }
    if (data.company) { setStep(3); return; } // silently drop bots
    setError('');
    setSending(true);
    const payload = {
      reference,
      enquiryType: enquiryType || (isDebtConsolidation ? 'Debt Consolidation Enquiry' : 'Finance Application'),
      referralSource: referralSource || 'Website',
      loanType: loanName,
      amount: `$${Number(data.amount).toLocaleString('en-AU')}`,
      term: data.term || '—',
      purpose: data.purpose || '—',
      name: data.name,
      email: data.email,
      phone: data.phone,
      employment: data.employment || '—',
      income: data.income || '—',
      consentToPrivacyPolicy: 'Yes',
      _subject: `${enquiryType || (isDebtConsolidation ? 'Debt Busters Referral — Debt Consolidation' : 'New website enquiry')} ${reference} — ${data.name}`,
    };
    const delivered = await submitEnquiry(payload);
    // If delivery failed, fall back to the visitor's email app so the lead is
    // never silently lost.
    if (!delivered) {
      const body =
        `Reference: ${reference}\n` +
        `Enquiry type: ${payload.enquiryType}\n` +
        `Referral source: ${payload.referralSource}\n` +
        `Name: ${data.name}\n` +
        `Mobile: ${data.phone}\n` +
        `Email: ${data.email}\n` +
        `Loan type: ${loanName}\n` +
        `Amount: ${payload.amount}\n` +
        `Term: ${payload.term}\n` +
        `Purpose: ${payload.purpose}\n` +
        `Employment: ${payload.employment}\n` +
        `Income: ${payload.income}`;
      window.location.href =
        `mailto:${CONTACT.email}?subject=${encodeURIComponent(`${payload._subject}`)}` +
        `&body=${encodeURIComponent(body)}`;
    }
    setSending(false);
    setStep(3);
  };
  const steps = [
    { name: 'Loan type' },
    { name: 'Details' },
    { name: 'You' },
    { name: 'Submit' },
  ];

  return (
    <main className="apply-shell" data-screen-label="04 Apply">
      <aside className="apply-rail">
        <div className="rail-top">
          <div onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <LogoProposed light={true} />
          </div>
          <div>
            <div className="eyebrow on-dark"><span className="dot"></span>Application</div>
            <h2 className="h2" style={{ color: 'var(--cream)', marginTop: 12 }}>
              Three minutes,<br/>
              <em style={{fontStyle:'italic', color:'var(--gold)'}}>no credit check.</em>
            </h2>
          </div>
        </div>
        <div className="apply-steps-list">
          {steps.map((s, i) => (
            <div key={s.name} className={`apply-step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="dot">{i < step ? '✓' : ['i','ii','iii','iv'][i]}</span>
              <span className="name">{s.name}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--line-dark)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="eyebrow on-dark">Need help?</span>
          <a href="tel:0756131905" style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--cream)' }}>07 5613 1905</a>
        </div>
      </aside>

      <div className="apply-body">
        {step === 0 && (
          <div className="fade-in">
            <div className="eyebrow"><span className="dot"></span>Step 01</div>
            <h1 className="h1" style={{ marginTop: 12, marginBottom: 12 }}>What are you <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>financing?</em></h1>
            <p className="lede" style={{ marginBottom: 40, maxWidth: '40ch' }}>Pick the closest match. If you're unsure, choose anything — we'll route you to the right broker.</p>
            <div className="loan-picker">
              {LOANS.map(l => (
                <div key={l.id} className={`item ${data.loan === l.id ? 'selected' : ''}`} onClick={() => l.id === 'credit' ? onNavigate('credit-repair-enquiry') : update('loan', l.id)}>
                  <span className="roman">{l.roman}</span>
                  <span className="name">{l.name}</span>
                  {l.id === 'credit' && <span className="item-hint">Separate enquiry →</span>}
                </div>
              ))}
              <div className={`item ${data.loan === 'other' ? 'selected' : ''}`} onClick={() => update('loan', 'other')}>
                <span className="roman">+</span>
                <span className="name">Something else</span>
              </div>
            </div>
            <div className="apply-actions">
              <a className="btn link" onClick={() => onNavigate('home')}>← Back to site</a>
              <a className="btn primary" onClick={() => data.loan && setStep(1)} style={{ opacity: data.loan ? 1 : 0.5 }}>Continue <span className="arrow">→</span></a>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <div className="eyebrow"><span className="dot"></span>Step 02</div>
            <h1 className="h1" style={{ marginTop: 12, marginBottom: 12 }}>How much, and <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>for how long?</em></h1>
            <p className="lede" style={{ marginBottom: 40 }}>An estimate is fine. We'll firm it up on the call.</p>
            <div className="field">
              <label>Amount needed</label>
              <input type="text" value={`$${Number(data.amount).toLocaleString('en-AU')}`} onChange={e => update('amount', Number(e.target.value.replace(/[^\d]/g, '')) || 0)}/>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Preferred term</label>
                <input type="text" placeholder="e.g. 5 years" value={data.term} onChange={e => update('term', e.target.value)} />
              </div>
              <div className="field">
                <label>Purpose</label>
                <input type="text" placeholder="e.g. New ute for the trades business" value={data.purpose} onChange={e => update('purpose', e.target.value)}/>
              </div>
            </div>
            <div className="apply-actions">
              <a className="btn link" onClick={() => setStep(0)}>← Back</a>
              <a className="btn primary" onClick={() => setStep(2)}>Continue <span className="arrow">→</span></a>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div className="eyebrow"><span className="dot"></span>Step 03</div>
            <h1 className="h1" style={{ marginTop: 12, marginBottom: 12 }}>And a <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>little</em> about you.</h1>
            <p className="lede" style={{ marginBottom: 40 }}>So your broker can call back with something useful. Fields marked <span aria-hidden="true">*</span> are required.</p>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ap-name">Full name <span aria-hidden="true">*</span></label>
                <input id="ap-name" type="text" required autoComplete="name" value={data.name} onChange={e => update('name', e.target.value)} placeholder="Jane Citizen"/>
              </div>
              <div className="field">
                <label htmlFor="ap-phone">Mobile <span aria-hidden="true">*</span></label>
                <input id="ap-phone" type="tel" required autoComplete="tel" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="04XX XXX XXX"/>
              </div>
            </div>
            <div className="field">
              <label htmlFor="ap-email">Email <span aria-hidden="true">*</span></label>
              <input id="ap-email" type="email" required autoComplete="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@email.com"/>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ap-employment">Employment</label>
                <input id="ap-employment" type="text" value={data.employment} onChange={e => update('employment', e.target.value)} placeholder="Self-employed / PAYG / SME owner"/>
              </div>
              <div className="field">
                <label htmlFor="ap-income">Annual income (approx.)</label>
                <input id="ap-income" type="text" inputMode="numeric" value={data.income} onChange={e => update('income', e.target.value)} placeholder="$120,000"/>
              </div>
            </div>

            {/* Honeypot: hidden from people, tempting to bots. Real users leave it blank. */}
            <input type="text" name="company" value={data.company} onChange={e => update('company', e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

            <label className="apply-consent">
              <input type="checkbox" checked={data.consent} onChange={e => update('consent', e.target.checked)} />
              <span>
                I consent to The Buyer Assist Group collecting and using my personal information to assess and progress my enquiry, and to contacting me and sharing my information with relevant brokers, lenders or service providers where required. I accept the <a onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} href="#privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
              </span>
            </label>

            {error && (
              <p role="alert" style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{error}</p>
            )}
            <div className="apply-actions">
              <a className="btn link" onClick={() => setStep(1)}>← Back</a>
              <button type="button" className="btn primary" onClick={submitApplication} disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Sending…' : <>Submit <span className="arrow">→</span></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in apply-done">
            <div className="eyebrow"><span className="dot"></span>{enquiryType || (isDebtConsolidation ? 'Debt consolidation enquiry received' : 'Application received')}</div>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 84px)', marginTop: 16, marginBottom: 24 }}>
              Thank you{data.name ? ',' : ''}<br/>
              <em>{data.name || 'we have your file.'}</em>
            </h1>
            <p className="lede" style={{ maxWidth: '46ch', marginBottom: 36 }}>
              A Buyer Assist broker will review your application and contact you within one business day.
            </p>
            <div className="grid-summary" style={{ marginBottom: 44 }}>
              <div>
                <span className="eyebrow"><span className="dot"></span>Reference</span>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginTop: 12 }} className="tabular">{reference}</div>
              </div>
              <div>
                <span className="eyebrow"><span className="dot"></span>Your broker</span>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginTop: 12 }}>To be assigned</div>
              </div>
            </div>

            {/* A. Send your supporting documents */}
            <section className="apply-panel" aria-labelledby="docs-h">
              <div className="eyebrow" style={{ color: 'var(--gold-2)' }}><span className="dot"></span>Fast-track your application</div>
              <h2 id="docs-h" className="apply-panel-title">Send your supporting documents</h2>
              <p className="apply-panel-lede">
                To help us assess your application sooner, please email your supporting documents to{' '}
                <a href={`mailto:${CONTACT.email}`} style={{ color: 'var(--gold-2)', textDecoration: 'underline' }}>{CONTACT.email}</a>{' '}
                and include your application reference in the subject line.
              </p>
              <div className="apply-ref-callout">
                <span className="eyebrow" style={{ margin: 0 }}>Your reference</span>
                <strong className="tabular">{reference}</strong>
                <span className="apply-ref-hint">Suggested subject: “Documents for application {reference}”</span>
              </div>
              <p className="apply-panel-sub">You may need to send:</p>
              <ul className="apply-checklist">
                {DOC_CHECKLIST.map(d => <li key={d}>{d}</li>)}
              </ul>
              <p className="apply-panel-note">
                Please only send documents relevant to your application. Your broker will let you know if anything else is required.
              </p>
              <a className="btn primary" href={docsMailto(reference, data.name)}>
                Email my documents <span className="arrow">→</span>
              </a>
            </section>

            {/* B. What happens next */}
            <section className="apply-panel" aria-labelledby="next-h">
              <div className="eyebrow"><span className="dot"></span>What happens next</div>
              <h2 id="next-h" className="apply-panel-title">A clear path from here</h2>
              <ol className="apply-timeline">
                {NEXT_STEPS.map((s, i) => (
                  <li key={s}><span className="apply-timeline-num">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
              <p className="apply-panel-note">
                Submitting an application does not guarantee approval. All finance is subject to lender assessment and responsible lending checks.
              </p>
            </section>

            {/* C. Contact */}
            <section className="apply-panel" aria-labelledby="help-h">
              <div className="eyebrow"><span className="dot"></span>Need a hand?</div>
              <h2 id="help-h" className="apply-panel-title">Contact The Buyer Assist Group</h2>
              <p className="apply-panel-lede">
                Our team is here to help with questions about your application, documents or what happens next.
              </p>
              <div className="apply-contact-rows">
                <a href={`tel:${CONTACT.phoneTel}`} className="apply-contact-row">
                  <span className="eyebrow" style={{ margin: 0 }}>Phone</span>
                  <strong>{CONTACT.phoneDisplay}</strong>
                </a>
                <a href={`mailto:${CONTACT.email}`} className="apply-contact-row">
                  <span className="eyebrow" style={{ margin: 0 }}>Email</span>
                  <strong>{CONTACT.email}</strong>
                </a>
              </div>
              <div className="cluster" style={{ marginTop: 28 }}>
                <a className="btn ghost" onClick={() => onNavigate('home')}>← Back to homepage</a>
                <button type="button" className="btn primary" onClick={() => { setStep(0); setError(''); setData({ loan: null, amount: 45000, term: '', purpose: '', name: '', email: '', phone: '', employment: '', income: '', consent: false, company: '' }); }}>
                  Start another application <span className="arrow">→</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

// =============================================================
// Broker profile page
// =============================================================
function BrokerProfilePage({ id, onNavigate }) {
  const broker = BROKERS.find(b => b.id === id);
  if (!broker) {
    onNavigate('about');
    return null;
  }
  return (
    <main data-screen-label="Broker Profile">
      <section className="broker-hero section dark">
        <div className="container">
          <button className="broker-back" onClick={() => onNavigate('about')}>← Back to the team</button>
          <div className="broker-profile-grid">
            <div className="broker-photo">
              <img src={PHOTOS[broker.photo]} alt={broker.name} style={{ objectPosition: 'center top' }}/>
            </div>
            <div className="broker-details">
              <div className="eyebrow on-dark"><span className="dot"></span>{broker.tag}</div>
              <h1 className="display" style={{ marginTop: 16, fontSize: 'clamp(48px, 6vw, 80px)', color: 'var(--cream)' }}>{broker.name}</h1>
              <p className="broker-role-label">{broker.role}</p>
              <div className="broker-contact-row">
                <a className="broker-email-link" href={`mailto:${broker.email}`}>{broker.email}</a>
                <a className="broker-phone-link" href={`tel:${CONTACT.phoneTel}`}>{CONTACT.phoneDisplay}</a>
              </div>
              {(broker.linkedin || broker.instagram || broker.facebook) && (
                <div className="broker-socials">
                  {broker.linkedin && <a href={broker.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><SocialIcon name="linkedin" size={20}/></a>}
                  {broker.instagram && <a href={broker.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><SocialIcon name="instagram" size={20}/></a>}
                  {broker.facebook && <a href={broker.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><SocialIcon name="facebook" size={20}/></a>}
                </div>
              )}
              <p className="broker-bio">{broker.bio}</p>
              <div className="broker-specialties">
                {broker.specialties.map(s => <span className="specialty-tag" key={s}>{s}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 40 }}>
                <a className="btn primary" onClick={() => onNavigate('apply')}>Apply with {broker.name} <span className="arrow">→</span></a>
                <a className="btn ghost on-dark" href={`mailto:${broker.email}`}>Send an email</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// =============================================================
// Partners page
// =============================================================
// =============================================================
// Credit Repair — information page (separate from a finance application)
// =============================================================
function CreditRepairPage({ onNavigate }) {
  const issues = [
    'Defaults listed on your credit file',
    'Court judgments',
    'Incorrect or outdated personal information',
    'Duplicated listings',
    'Repayment history errors',
    'Listings resulting from identity theft or fraud',
    'Credit enquiries you don’t recognise',
  ];
  const process = [
    'You submit a Credit Repair Enquiry with the details of your situation',
    'We review the information and advise whether assistance may be available',
    'Where suitable, we introduce you to our partner Wipe Credit Clean',
    'They assess your credit file and explain any options',
    'You decide how you’d like to proceed — no obligation',
  ];
  return (
    <main data-screen-label="Credit Repair">
      <PageHead
        eyebrow="Credit repair · with our partner Wipe Credit Clean"
        title="A path back to <em style='font-style:italic;color:var(--gold)'>yes.</em>"
        meta="Credit repair is a separate service from a standard finance application. Through our partner Wipe Credit Clean, we help clients look into credit file issues that may be holding them back. No outcome can be guaranteed."
        image={PHOTOS.credit}
      />

      <section className="section paper">
        <div className="container cr-narrow">
          <div className="eyebrow"><span className="dot"></span>What it may involve</div>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 20 }}>Understanding what’s on your <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>credit file.</em></h2>
          <p className="body" style={{ fontSize: 17, maxWidth: '58ch', marginBottom: 16 }}>
            Credit repair assistance involves reviewing your credit file, identifying listings that may be incorrect, outdated, duplicated or unfair, and — where appropriate — disputing them with the relevant creditor or credit reporting body through our partner, Wipe Credit Clean.
          </p>
          <p className="body" style={{ fontSize: 17, maxWidth: '58ch', color: 'var(--muted)' }}>
            It is a separate service from applying for finance. We’ll always be upfront about whether it’s likely to help in your situation, and no removal or outcome can be guaranteed.
          </p>
        </div>
      </section>

      <section className="section cream" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="container cr-narrow">
          <div className="eyebrow"><span className="dot"></span>Common credit file issues</div>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 28 }}>What we most often see.</h2>
          <ul className="cr-issue-grid">
            {issues.map(i => <li key={i}><span className="bp-dot"></span>{i}</li>)}
          </ul>
        </div>
      </section>

      <section className="section paper" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="container cr-narrow">
          <div className="eyebrow"><span className="dot"></span>How the process works</div>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 28 }}>Clear steps, no surprises.</h2>
          <ol className="apply-timeline">
            {process.map((s, i) => (
              <li key={s}><span className="apply-timeline-num">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section cream" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="container cr-narrow">
          <div className="eyebrow"><span className="dot"></span>What to provide</div>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 20 }}>Helpful information to have ready.</h2>
          <p className="body" style={{ fontSize: 17, maxWidth: '58ch', marginBottom: 20 }}>
            You don’t need everything to get started — just tell us what you can. If it helps, you can later email supporting documents such as credit reports, default notices, correspondence from creditors, identification, and any previous dispute responses to <a href={`mailto:${CONTACT.email}`} style={{ color: 'var(--gold-2)', textDecoration: 'underline' }}>{CONTACT.email}</a>.
          </p>
          <div className="apply-panel-note" style={{ maxWidth: '58ch' }}>
            Wipe Credit Clean is a separate business. The Buyer Assist Group may refer suitable clients to them. Credit repair outcomes cannot be guaranteed.
          </div>
          <div className="cluster" style={{ marginTop: 32 }}>
            <button type="button" className="btn primary" onClick={() => onNavigate('credit-repair-enquiry')}>
              Start a Credit Repair Enquiry <span className="arrow">→</span>
            </button>
            <button type="button" className="btn ghost" onClick={() => onNavigate('partners')}>See our partners</button>
          </div>
        </div>
      </section>
    </main>
  );
}

// =============================================================
// Credit Repair — dedicated enquiry form (no finance questions, no uploads)
// =============================================================
function CreditRepairEnquiryPage({ onNavigate }) {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [reference] = React.useState(() => 'BAG-CR-' + Math.floor(Math.random() * 9000 + 1000));
  const [f, setF] = React.useState({
    issue: '', reportingBody: '', listingType: '', creditor: '', belief: '',
    awareDate: '', contactedBody: '', previouslyDisputed: '', hasReport: '',
    outcome: '', details: '', name: '', email: '', phone: '', consent: false, company: '',
  });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (sending) return;
    if (!f.name.trim()) { setError('Please enter your full name.'); return; }
    if (!isValidAUPhone(f.phone)) { setError('Please enter a valid Australian mobile or phone number.'); return; }
    if (!isValidEmail(f.email)) { setError('Please enter a valid email address.'); return; }
    if (!f.issue.trim()) { setError('Please tell us what issue you’re experiencing with your credit file.'); return; }
    if (!f.consent) { setError('Please confirm you accept the Privacy Policy so we can review your enquiry.'); return; }
    if (f.company) { setSent(true); return; }
    setError('');
    setSending(true);
    const payload = {
      reference,
      enquiryType: 'Credit Repair Enquiry',
      referralSource: 'Website — Credit Repair',
      issue: f.issue,
      creditReportingBody: f.reportingBody || '—',
      listingType: f.listingType || '—',
      creditor: f.creditor || '—',
      belief: f.belief || '—',
      firstAware: f.awareDate || '—',
      contactedCreditorOrBody: f.contactedBody || '—',
      previouslyDisputed: f.previouslyDisputed || '—',
      hasCreditReport: f.hasReport || '—',
      desiredOutcome: f.outcome || '—',
      details: f.details || '—',
      name: f.name, email: f.email, phone: f.phone,
      consentToPrivacyPolicy: 'Yes',
      _subject: `Credit Repair Enquiry ${reference} — ${f.name}`,
    };
    const delivered = await submitEnquiry(payload);
    if (!delivered) {
      const body = Object.entries({
        Reference: reference, Issue: f.issue, 'Reporting body': f.reportingBody, 'Listing type': f.listingType,
        Creditor: f.creditor, Belief: f.belief, 'First aware': f.awareDate, 'Contacted creditor/body': f.contactedBody,
        'Previously disputed': f.previouslyDisputed, 'Has credit report': f.hasReport, 'Desired outcome': f.outcome,
        Details: f.details, Name: f.name, Email: f.email, Phone: f.phone,
      }).map(([k, v]) => `${k}: ${v || '—'}`).join('\n');
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Credit Repair Enquiry ${reference} — ${f.name}`)}&body=${encodeURIComponent(body)}`;
    }
    setSending(false);
    setSent(true);
  };

  const selects = {
    reportingBody: ['Equifax', 'Experian', 'illion', 'Not sure'],
    listingType: ['Incorrect default', 'Paid default showing incorrectly', 'Unknown credit enquiry', 'Incorrect account information', 'Duplicate listing', 'Identity theft or fraud', 'Credit score concern', 'Debt dispute', 'Other'],
    belief: ['Incorrect', 'Outdated', 'Duplicated', 'Fraudulent', 'Unfair', 'Not sure'],
    yesno: ['Yes', 'No', 'Not sure'],
  };

  if (sent) {
    return (
      <main data-screen-label="Credit Repair Enquiry">
        <section className="section paper" style={{ minHeight: '70vh' }}>
          <div className="container cr-narrow apply-done" style={{ paddingTop: 24 }}>
            <div className="eyebrow"><span className="dot"></span>Credit Repair Enquiry received</div>
            <h1 className="h1" style={{ marginTop: 16, marginBottom: 20 }}>Thank you{f.name ? ', ' : ''}<em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>{f.name}</em>.</h1>
            <p className="lede" style={{ maxWidth: '48ch', marginBottom: 28 }}>
              We’ll review the information you’ve provided and advise whether assistance may be available. A Buyer Assist team member will contact you within one business day. No outcome can be guaranteed.
            </p>
            <div className="apply-ref-callout" style={{ marginBottom: 32 }}>
              <span className="eyebrow" style={{ margin: 0 }}>Your reference</span>
              <strong className="tabular">{reference}</strong>
              <span className="apply-ref-hint">Include this in your email subject line</span>
            </div>
            <section className="apply-panel" aria-labelledby="crdocs-h">
              <div className="eyebrow" style={{ color: 'var(--gold-2)' }}><span className="dot"></span>Optional</div>
              <h2 id="crdocs-h" className="apply-panel-title">Send any supporting documents</h2>
              <p className="apply-panel-lede">
                If you have them, email any relevant documents to <a href={`mailto:${CONTACT.email}`} style={{ color: 'var(--gold-2)', textDecoration: 'underline' }}>{CONTACT.email}</a> and include your reference <strong>{reference}</strong> in the subject line.
              </p>
              <ul className="apply-checklist">
                {CREDIT_REPAIR_DOCS.map(d => <li key={d}>{d}</li>)}
              </ul>
              <a className="btn primary" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`Documents for ${reference}${f.name ? ' — ' + f.name : ''}`)}&body=${encodeURIComponent(`Hi Buyer Assist Group,\n\nPlease find attached documents for my credit repair enquiry.\n\nReference: ${reference}\n\nThanks.${f.name ? '\n' + f.name : ''}`)}`}>
                Email my documents <span className="arrow">→</span>
              </a>
            </section>
            <div className="cluster" style={{ marginTop: 8 }}>
              <button type="button" className="btn ghost" onClick={() => onNavigate('home')}>← Back to homepage</button>
              <button type="button" className="btn primary" onClick={() => onNavigate('partners')}>See our partners <span className="arrow">→</span></button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main data-screen-label="Credit Repair Enquiry">
      <PageHead
        eyebrow="Credit Repair Enquiry"
        title="Tell us what’s <em style='font-style:italic;color:var(--gold)'>on your file.</em>"
        meta="This is a credit repair enquiry, not a finance application. Share what you can — we’ll review it and advise whether assistance may be available through our partner Wipe Credit Clean. No outcome can be guaranteed."
        image={PHOTOS.credit}
      />
      <section className="section paper">
        <div className="container cr-narrow">
          <form className="bp-form" onSubmit={submit} noValidate>
            <div className="bp-field">
              <label htmlFor="cr-issue">What issue are you experiencing with your credit file? <span aria-hidden="true">*</span></label>
              <input id="cr-issue" type="text" required value={f.issue} onChange={set('issue')} placeholder="e.g. A default I don’t think is correct" />
            </div>
            <div className="bp-row">
              <div className="bp-field">
                <label htmlFor="cr-body">Which credit reporting body shows the issue?</label>
                <select id="cr-body" className="cr-select" value={f.reportingBody} onChange={set('reportingBody')}>
                  <option value="">Select…</option>
                  {selects.reportingBody.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="bp-field">
                <label htmlFor="cr-type">What type of listing is it?</label>
                <select id="cr-type" className="cr-select" value={f.listingType} onChange={set('listingType')}>
                  <option value="">Select…</option>
                  {selects.listingType.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="bp-row">
              <div className="bp-field">
                <label htmlFor="cr-creditor">Which creditor or company added the listing?</label>
                <input id="cr-creditor" type="text" value={f.creditor} onChange={set('creditor')} placeholder="e.g. a telco, bank or utility" />
              </div>
              <div className="bp-field">
                <label htmlFor="cr-belief">Do you believe the information is…</label>
                <select id="cr-belief" className="cr-select" value={f.belief} onChange={set('belief')}>
                  <option value="">Select…</option>
                  {selects.belief.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="bp-row">
              <div className="bp-field">
                <label htmlFor="cr-aware">When did you first become aware of the issue?</label>
                <input id="cr-aware" type="text" value={f.awareDate} onChange={set('awareDate')} placeholder="e.g. last month, or 2023" />
              </div>
              <div className="bp-field">
                <label htmlFor="cr-contacted">Have you contacted the creditor or reporting body?</label>
                <select id="cr-contacted" className="cr-select" value={f.contactedBody} onChange={set('contactedBody')}>
                  <option value="">Select…</option>
                  {selects.yesno.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="bp-row">
              <div className="bp-field">
                <label htmlFor="cr-disputed">Have you previously disputed the listing?</label>
                <select id="cr-disputed" className="cr-select" value={f.previouslyDisputed} onChange={set('previouslyDisputed')}>
                  <option value="">Select…</option>
                  {selects.yesno.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="bp-field">
                <label htmlFor="cr-report">Do you have a current copy of your credit report?</label>
                <select id="cr-report" className="cr-select" value={f.hasReport} onChange={set('hasReport')}>
                  <option value="">Select…</option>
                  {selects.yesno.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="bp-field">
              <label htmlFor="cr-outcome">What outcome are you hoping to achieve?</label>
              <input id="cr-outcome" type="text" value={f.outcome} onChange={set('outcome')} placeholder="e.g. Understand my options and clear an incorrect listing" />
            </div>
            <div className="bp-field">
              <label htmlFor="cr-details">Explain the situation in your own words</label>
              <textarea id="cr-details" rows={4} value={f.details} onChange={set('details')} placeholder="Anything that helps us understand what happened" />
            </div>

            <div className="cr-divider" role="separator"></div>

            <div className="bp-row">
              <div className="bp-field">
                <label htmlFor="cr-name">Full name <span aria-hidden="true">*</span></label>
                <input id="cr-name" type="text" required autoComplete="name" value={f.name} onChange={set('name')} placeholder="Jane Citizen" />
              </div>
              <div className="bp-field">
                <label htmlFor="cr-phone">Mobile <span aria-hidden="true">*</span></label>
                <input id="cr-phone" type="tel" required autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="04XX XXX XXX" />
              </div>
            </div>
            <div className="bp-field">
              <label htmlFor="cr-email">Email <span aria-hidden="true">*</span></label>
              <input id="cr-email" type="email" required autoComplete="email" value={f.email} onChange={set('email')} placeholder="you@email.com" />
            </div>

            {/* Honeypot */}
            <input type="text" name="company" value={f.company} onChange={set('company')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

            <label className="apply-consent">
              <input type="checkbox" checked={f.consent} onChange={set('consent')} />
              <span>
                I consent to The Buyer Assist Group collecting and using this information to review my credit repair enquiry, contacting me, and sharing it with our partner Wipe Credit Clean where relevant. I accept the <a onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} href="#privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
              </span>
            </label>

            {error && <p role="alert" style={{ color: '#b3261e', fontSize: 14, marginTop: 4 }}>{error}</p>}
            <p className="apply-panel-note" style={{ marginTop: 4 }}>
              The Buyer Assist Group will review your information and advise whether assistance may be available. No credit repair outcome can be guaranteed.
            </p>
            <button type="submit" className="btn primary" disabled={sending} style={{ marginTop: 8, opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending…' : <>Submit Credit Repair Enquiry <span className="arrow">→</span></>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

// =============================================================
// Partners page
// =============================================================
function PartnersPage({ onNavigate }) {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', business: '', email: '', phone: '', message: '', consent: false, company: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (sending) return;
    if (!form.name.trim() || !form.business.trim()) { setError('Please enter your name and business name.'); return; }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.phone && !isValidAUPhone(form.phone)) { setError('Please enter a valid Australian phone number, or leave it blank.'); return; }
    if (!form.consent) { setError('Please accept the Privacy Policy so we can respond to your enquiry.'); return; }
    if (form.company) { setSent(true); return; }
    setError('');
    setSending(true);
    const payload = {
      enquiryType: 'Referral Partner Enquiry',
      referralSource: 'Partners page — Work with us',
      name: form.name, business: form.business, email: form.email, phone: form.phone || '—',
      message: form.message || '—', consentToPrivacyPolicy: 'Yes',
      _subject: `Referral Partner Enquiry — ${form.business}`,
    };
    const delivered = await submitEnquiry(payload);
    if (!delivered) {
      const body = `Name: ${form.name}\nBusiness: ${form.business}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`;
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Referral Partner Enquiry — ${form.business}`)}&body=${encodeURIComponent(body)}`;
    }
    setSending(false);
    setSent(true);
  };

  return (
    <main data-screen-label="Partners">
      <PageHead
        eyebrow="Our partner network"
        title="People we <em style='font-style:italic;color:var(--gold)'>trust.</em>"
        meta="We work with a trusted network of referral partners across Australia. They introduce their clients to us, we look after the finance process, and we keep everyone informed along the way."
        image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=2000&q=80&auto=format&fit=crop"
      />

      {/* Intro */}
      <section className="section paper">
        <div className="container">
          <div className="partners-intro">
            <div className="eyebrow"><span className="dot"></span>Featured partners</div>
            <h2 className="h2" style={{ marginTop: 12, maxWidth: '20ch' }}>The people who <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>send us their best.</em></h2>
            <p className="body" style={{ fontSize: 17, maxWidth: '52ch', marginTop: 16, color: 'var(--muted)' }}>
              Each partner below works with us in a specific way — from home loans to debt consolidation and credit repair. Where it suits a client, we make a warm introduction and manage the finance process end to end.
            </p>
          </div>

          {/* Ready Finance */}
          <div className="partner-feature" id="ready-finance">
            <div className="partner-photo-wrap">
              <img src="/assets/ben-ready-finance.jpg" alt="Ben, Director of Ready Finance" className="partner-photo" />
              <div className="partner-photo-caption">
                <span className="partner-name">Ben</span>
                <span className="partner-title">Director · Ready Finance</span>
              </div>
            </div>
            <div className="partner-copy">
              <img src="/assets/ready-finance-logo.png" alt="Ready Finance logo" className="partner-logo" />
              <blockquote className="partner-quote">
                "At Ready Finance, we have always believed our clients deserve more than a single set of options. That is why we have partnered with The Buyer Assist Group — an experienced, independent broker who will sit in your corner, review everything you have, and find what is genuinely best for you."
              </blockquote>
              <p className="partner-bio">
                Ready Finance Group specialises in home loans. When their clients need asset finance, personal loans, or business lending, Ben and the team send them straight to us. Supporting clients Australia-wide through experienced finance professionals and trusted industry partnerships.
              </p>
              <div className="partner-cta-row">
                <button type="button" className="btn primary" onClick={() => onNavigate('apply')}>Start a finance enquiry <span className="arrow">→</span></button>
                <span className="eyebrow" style={{ margin: 0 }}><span className="dot"></span>Trusted referral partner</span>
              </div>
            </div>
          </div>

          {/* Debt Busters */}
          <div className="partner-feature flip" id="debt-busters">
            <div className="partner-photo-wrap">
              <div className="partner-logo-panel">
                <img src="/assets/debt-busters-logo.png" alt="Debt Busters logo" className="partner-brand-logo" />
                <span className="pw-sub">Debt consolidation partner</span>
              </div>
            </div>
            <div className="partner-copy">
              <div className="eyebrow"><span className="dot"></span>Debt Busters</div>
              <h3 className="partner-heading">Debt Busters</h3>
              <p className="partner-bio">
                We work alongside Debt Busters to help everyday Australians take control of multiple debts and explore ways to simplify their repayments.
              </p>
              <p className="partner-bio">
                Where suitable, our team can assess debt consolidation options that may combine eligible debts into one structured repayment. We guide the client through the finance process, explain the available options and keep Debt Busters updated along the way.
              </p>
              <p className="partner-bio" style={{ fontStyle: 'italic', color: 'var(--ink)' }}>
                Helping everyday Australians simplify debt and move forward with a clearer plan.
              </p>
              <p className="apply-panel-note" style={{ margin: '4px 0 20px' }}>
                All applications are subject to assessment, eligibility and lender approval. Debt consolidation is not guaranteed and may not reduce repayments, interest or overall cost. Debt Busters is a referral partner, not the lender.
              </p>
              <div className="partner-cta-row">
                <button type="button" className="btn primary" onClick={() => onNavigate('apply', { loan: 'debt-consolidation', referralSource: 'Debt Busters', enquiryType: 'Debt Busters Referral - Debt Consolidation' })}>
                  Enquire about debt consolidation <span className="arrow">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wipe Credit Clean */}
          <div className="partner-feature" id="wipe-credit-clean">
            <div className="partner-photo-wrap">
              <img src={PHOTOS.larniWcc} alt="Larni from Wipe Credit Clean, with The Buyer Assist Group" className="partner-photo" style={{ objectPosition: 'center top' }} />
              <div className="partner-photo-caption">
                <span className="partner-name">Larni</span>
                <span className="partner-title">Wipe Credit Clean</span>
              </div>
            </div>
            <div className="partner-copy">
              <div className="eyebrow"><span className="dot"></span>Credit repair partner</div>
              <h3 className="partner-heading">Wipe Credit Clean</h3>
              <p className="partner-bio">
                When the answer is "not yet", we don't walk away. In partnership with Larni and the team at Wipe Credit Clean, we help clients look into credit file issues that may be standing between them and the loan they want.
              </p>
              <p className="partner-bio">
                Credit repair is a separate service from a standard finance application. Where it's suitable, we refer clients to Wipe Credit Clean, who assess the credit file and explain any options.
              </p>
              <p className="apply-panel-note" style={{ margin: '4px 0 20px' }}>
                Wipe Credit Clean is a trusted, separate business. No credit repair outcome can be guaranteed.
              </p>
              <div className="partner-cta-row">
                <button type="button" className="btn primary" onClick={() => onNavigate('credit-repair')}>Learn about credit repair <span className="arrow">→</span></button>
                <button type="button" className="btn ghost" onClick={() => onNavigate('credit-repair-enquiry')}>Start a credit repair enquiry</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a partner */}
      <section className="section cream" id="work-with-us" style={{ borderTop: '1px solid var(--line)', scrollMarginTop: 96 }}>
        <div className="container">
          <div style={{ marginBottom: 48 }}>
            <div className="eyebrow"><span className="dot"></span>Work with us</div>
            <h2 className="h2" style={{ marginTop: 12 }}>Become a <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>referral partner.</em></h2>
          </div>
          <div className="bp-grid">
            <div className="bp-pitch">
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300, lineHeight: 1.75, color: 'var(--muted)', maxWidth: '38ch' }}>
                If your clients ever need car finance, equipment, personal lending, or business capital, we want to hear from you. We protect the relationship and keep you in the loop every step of the way.
              </p>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['We report back on every referred client', '50+ lenders — best fit, not the easiest approval', 'We protect the relationship from first call to settlement'].map(pt => (
                  <div key={pt} className="bp-point"><span className="bp-dot"></span>{pt}</div>
                ))}
              </div>
            </div>
            <div className="bp-form-wrap">
              {sent ? (
                <div className="bp-thankyou">
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)' }}>Message received.</span>
                  <p style={{ color: 'var(--muted)', marginTop: 10, fontSize: 14 }}>We'll be in touch shortly.</p>
                </div>
              ) : (
                <form className="bp-form" onSubmit={handleSubmit} noValidate>
                  <div className="bp-row">
                    <div className="bp-field">
                      <label htmlFor="pp-name">Your name <span aria-hidden="true">*</span></label>
                      <input id="pp-name" type="text" required value={form.name} onChange={set('name')} placeholder="Jane Smith" />
                    </div>
                    <div className="bp-field">
                      <label htmlFor="pp-business">Business name <span aria-hidden="true">*</span></label>
                      <input id="pp-business" type="text" required value={form.business} onChange={set('business')} placeholder="Smith Finance" />
                    </div>
                  </div>
                  <div className="bp-row">
                    <div className="bp-field">
                      <label htmlFor="pp-email">Email <span aria-hidden="true">*</span></label>
                      <input id="pp-email" type="email" required value={form.email} onChange={set('email')} placeholder="jane@smithfinance.com.au" />
                    </div>
                    <div className="bp-field">
                      <label htmlFor="pp-phone">Phone</label>
                      <input id="pp-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="04xx xxx xxx" />
                    </div>
                  </div>
                  <div className="bp-field">
                    <label htmlFor="pp-message">Tell us about your business</label>
                    <textarea id="pp-message" rows={3} value={form.message} onChange={set('message')} placeholder="What types of clients do you work with?" />
                  </div>
                  <input type="text" name="company" value={form.company} onChange={set('company')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
                  <label className="apply-consent">
                    <input type="checkbox" checked={form.consent} onChange={set('consent')} />
                    <span>I accept the <a onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} href="#privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a> and consent to being contacted about a referral partnership.</span>
                  </label>
                  {error && <p role="alert" style={{ color: '#b3261e', fontSize: 14, marginTop: 4 }}>{error}</p>}
                  <button type="submit" className="btn primary" disabled={sending} style={{ marginTop: 8, opacity: sending ? 0.6 : 1 }}>
                    {sending ? 'Sending…' : <>Register interest <span className="arrow">→</span></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { ServicesPage, AboutPage, ApplyPage, BrokerProfilePage, PartnersPage, CreditRepairPage, CreditRepairEnquiryPage, PageHead });
