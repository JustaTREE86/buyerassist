/* global React */
const { useEffect: useEffectClients } = React;

// Replace these with real client quotes — names and loan types only, no surnames needed
const TESTIMONIALS = [
  {
    quote: "Josh made the whole process dead simple. I had my car loan sorted in two days and the rate was better than anything the dealer offered.",
    name: "Michael T.",
    detail: "Asset & Car Loan · Brisbane",
  },
  {
    quote: "I had a complicated situation with my credit history and Josh was upfront about everything. He found a lender that actually worked for me.",
    name: "Sarah K.",
    detail: "Personal Loan · Gold Coast",
  },
  {
    quote: "We needed equipment finance fast for a new contract. The Buyer Assist team had us approved and settled inside a week.",
    name: "Dave R.",
    detail: "Commercial Equipment · Brisbane Southside",
  },
];

function ClientsPage({ onNavigate }) {
  useEffectClients(() => {
    const s = document.createElement('script');
    s.src = 'https://reputationhub.site/reputation/assets/review-widget.js';
    s.type = 'text/javascript';
    document.body.appendChild(s);
    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);

  return (
    <main data-screen-label="Our Clients">
      <section className="page-head">
        <div className="container">
          <div className="head-grid">
            <div>
              <div className="eyebrow on-dark"><span className="dot"></span>Our clients</div>
              <h1 className="h1" style={{ color: 'var(--cream)' }}>
                Real people.<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Real results.</em>
              </h1>
            </div>
            <p className="head-meta">We measure success by whether the deal was right for the client, not just whether it settled. Here's what clients say about working with us.</p>
          </div>
        </div>
      </section>

      {/* Featured testimonials */}
      <section className="section paper">
        <div className="container">
          <div style={{ marginBottom: 56 }}>
            <div className="eyebrow"><span className="dot"></span>Client stories</div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              In their <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>own words.</em>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: 'var(--cream)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '32px 28px',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                <div style={{ color: 'var(--gold)', fontSize: 32, lineHeight: 1, fontFamily: 'var(--serif)', fontWeight: 300 }}>"</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300, lineHeight: 1.7, color: 'var(--ink)', flex: 1 }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review widget */}
      <section className="section cream" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="container">
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow"><span className="dot"></span>Verified reviews</div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              What Google says.
            </h2>
          </div>
          {/* No fixed height: the LeadConnector review-widget.js script loaded
              above resizes this iframe to its real content height via postMessage.
              A hardcoded height (previously 800px) is what left a large blank gap
              below the reviews. */}
          <iframe
            className="lc_reviews_widget"
            src="https://reputationhub.site/reputation/widgets/review_widget/W1CwEUbM4SfAhYp0xWKA?widgetId=6a4492f09a529eee8f642467"
            title="Verified Google reviews for The Buyer Assist Group"
            frameBorder="0"
            scrolling="no"
            style={{ minWidth: '100%', width: '100%', display: 'block', border: 0 }}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="section paper" style={{ borderTop: '1px solid var(--line)', padding: 'clamp(60px, 8vw, 100px) 0' }}>
        <div className="container">
          <div className="row-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
            <h2 className="h2" style={{ maxWidth: '20ch' }}>
              Ready to be our next <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>success story?</em>
            </h2>
            <a className="btn primary" onClick={() => onNavigate('apply')}>
              Start your application <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { ClientsPage });
