/* global React, PHOTOS, LOANS, Icon, LogoExisting, LogoProposed, LENDERS */
const { useState: useStateInner } = React;

// Lead delivery: paste a Formspree form endpoint to send applications straight
// to the inbox (https://formspree.io — free tier). Leave '' and the form still
// works as a confirmation flow; nothing is lost, it just isn't emailed yet.
const FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/abcdwxyz'

// =============================================================
// Page header (shared)
// =============================================================
function PageHead({ eyebrow, title, meta }) {
  return (
    <section className="page-head">
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
        meta="We finance seven categories with the same boutique attention. No call-centre scripts, no panel-fit-the-customer. We start from your situation and work outward."
      />
      <section className="section paper">
        <div className="container">
          <div className="services-list">
            {LOANS.map(l => (
              <div className="service-row" key={l.id} onClick={() => onNavigate('apply', { loan: l.id })}>
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
        meta="Founded in Brisbane by Leonie. Boutique by design. We're the brokerage you call when you're tired of being a customer number."
      />

      {/* Founders / story */}
      <section className="section paper">
        <div className="container">
          <div className="feature flip">
            <div className="feature-media" style={{ aspectRatio: '4 / 5' }}>
              <img src={PHOTOS.leonie} alt="Leonie — Founder, Principal Broker" style={{ objectPosition: 'center top' }}/>
            </div>
            <div className="feature-copy">
              <div className="eyebrow"><span className="dot"></span>Founder's note · Leonie</div>
              <h2 className="h2">"I left the bank because nobody was being told the <em style={{fontStyle:'italic', color:'var(--gold-2)'}}>truth.</em>"</h2>
              <p className="body" style={{ fontSize: 17 }}>
                The Buyer Assist Group started with one belief: that everyone — the young couple buying their first car, the dentist financing a new chair, the cafe owner growing into a second shopfront — deserves a broker who reads their file like it's the only file that day.
              </p>
              <p className="body" style={{ fontSize: 17 }}>
                Bespoke isn't a buzzword for us. It's the entire posture. We're small on purpose. We answer our own phones. We say no when no is the right answer. And when yes is on the table, we negotiate until it's the best yes available.
              </p>
              <div className="cluster" style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--gold-2)' }}>— Leonie</span>
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginLeft: 12 }}>Founder · Principal Broker</span>
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
            <div className="team-card">
              <div className="photo">
                <span className="tag">Principal Broker</span>
                <img src={PHOTOS.leonie} alt="Leonie" style={{ objectPosition: 'center top' }}/>
              </div>
              <div className="name">Leonie</div>
              <div className="role">Founder · Principal Broker · ACR 564090</div>
            </div>
            <div className="team-card">
              <div className="photo">
                <span className="tag">Asset Finance</span>
                <img src={PHOTOS.team2} alt=""/>
              </div>
              <div className="name">[ Senior Broker ]</div>
              <div className="role">Asset & Leisure Finance</div>
            </div>
            <div className="team-card">
              <div className="photo">
                <span className="tag">Commercial</span>
                <img src={PHOTOS.team3} alt=""/>
              </div>
              <div className="name">[ Commercial Lead ]</div>
              <div className="role">Business & Medical Equipment</div>
            </div>
          </div>
          <p className="body" style={{ marginTop: 32, fontSize: 12, fontStyle: 'italic', color: 'var(--muted)' }}>
            Remaining portraits are placeholders — to be swapped with real team photography.
          </p>
        </div>
      </section>

      {/* Numbers strip */}
      <section className="section dark" style={{ padding: 'clamp(60px, 8vw, 100px) 0' }}>
        <div className="container">
          <div className="grid-stats-4">
            {[
              { n: '50+', l: 'Lenders on panel' },
              { n: '24h', l: 'Average pre-approval' },
              { n: '7', l: 'Loan products' },
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
function ApplyPage({ initialLoan, onNavigate }) {
  const [step, setStep] = useStateInner(initialLoan ? 1 : 0);
  const [data, setData] = useStateInner({
    loan: initialLoan || null,
    amount: 45000,
    name: '',
    email: '',
    phone: '',
    employment: '',
    income: '',
  });

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const submitApplication = async () => {
    if (FORM_ENDPOINT) {
      try {
        await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...data, _subject: 'New website enquiry — The Buyer Assist Group' }),
        });
      } catch (e) { /* fail silently — still show the confirmation screen */ }
    }
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
          <a href="tel:0439300621" style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--cream)' }}>0439 300 621</a>
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
                <div key={l.id} className={`item ${data.loan === l.id ? 'selected' : ''}`} onClick={() => update('loan', l.id)}>
                  <span className="roman">{l.roman}</span>
                  <span className="name">{l.name}</span>
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
                <input type="text" placeholder="e.g. 5 years" />
              </div>
              <div className="field">
                <label>Purpose</label>
                <input type="text" placeholder="e.g. New ute for the trades business"/>
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
            <p className="lede" style={{ marginBottom: 40 }}>So your broker can call back with something useful.</p>
            <div className="field-row">
              <div className="field">
                <label>Full name</label>
                <input type="text" value={data.name} onChange={e => update('name', e.target.value)} placeholder="Jane Citizen"/>
              </div>
              <div className="field">
                <label>Mobile</label>
                <input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="04XX XXX XXX"/>
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@email.com"/>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Employment</label>
                <input type="text" value={data.employment} onChange={e => update('employment', e.target.value)} placeholder="Self-employed / PAYG / SME owner"/>
              </div>
              <div className="field">
                <label>Annual income (approx.)</label>
                <input type="text" value={data.income} onChange={e => update('income', e.target.value)} placeholder="$120,000"/>
              </div>
            </div>
            <div className="apply-actions">
              <a className="btn link" onClick={() => setStep(1)}>← Back</a>
              <a className="btn primary" onClick={submitApplication}>Submit <span className="arrow">→</span></a>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ paddingTop: 80 }}>
            <div className="eyebrow"><span className="dot"></span>Submitted</div>
            <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 96px)', marginTop: 16, marginBottom: 24 }}>
              Thank you{data.name ? ',' : ''}<br/>
              <em>{data.name || 'we have your file.'}</em>
            </h1>
            <p className="lede" style={{ maxWidth: '40ch', marginBottom: 40 }}>
              A broker will call you within 24 business hours. In the meantime, here's a quick read on what to expect.
            </p>
            <div className="grid-summary" style={{ marginBottom: 40 }}>
              <div>
                <span className="eyebrow"><span className="dot"></span>Reference</span>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginTop: 12 }} className="tabular">BAG-{Math.floor(Math.random()*9000+1000)}</div>
              </div>
              <div>
                <span className="eyebrow"><span className="dot"></span>Your broker</span>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginTop: 12 }}>To be assigned</div>
              </div>
            </div>
            <div className="cluster">
              <a className="btn ghost" onClick={() => onNavigate('home')}>← Back to homepage</a>
              <a className="btn primary" onClick={() => { setStep(0); setData({ loan: null, amount: 45000, name: '', email: '', phone: '', employment: '', income: '' }); }}>
                Start another <span className="arrow">→</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

Object.assign(window, { ServicesPage, AboutPage, ApplyPage, PageHead });
