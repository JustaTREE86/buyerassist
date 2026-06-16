/* global React, ReactDOM, LogoExisting, LogoProposed, Icon, HomePage, ServicesPage, AboutPage, ApplyPage, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor */
const { useState: useStateApp, useEffect: useEffectApp } = React;

// =============================================================
// Palettes (swap via tweaks)
// =============================================================
const PALETTES = {
  navyGold: {
    name: 'Navy & Gold',
    '--ink': '#0A1F3D',
    '--ink-2': '#102A4F',
    '--ink-3': '#1A3963',
    '--gold': '#C8A65A',
    '--gold-2': '#B8923F',
    '--gold-soft': '#E2CB94',
    '--cream': '#F5F1E8',
    '--cream-2': '#EFE9DA',
    '--paper': '#FBF8F1',
    '--bone': '#FFFEFB',
    '--muted': 'rgba(10, 31, 61, 0.58)',
    '--line': 'rgba(10, 31, 61, 0.12)',
  },
  forestBrass: {
    name: 'Forest & Brass',
    '--ink': '#0E2A1F',
    '--ink-2': '#143828',
    '--ink-3': '#1C4633',
    '--gold': '#D4A574',
    '--gold-2': '#B8884F',
    '--gold-soft': '#E8C9A0',
    '--cream': '#EFE9D6',
    '--cream-2': '#E5DCC2',
    '--paper': '#F6F1E2',
    '--bone': '#FBF7EB',
    '--muted': 'rgba(14, 42, 31, 0.6)',
    '--line': 'rgba(14, 42, 31, 0.12)',
  },
  espressoCopper: {
    name: 'Espresso & Copper',
    '--ink': '#1F1410',
    '--ink-2': '#2A1C16',
    '--ink-3': '#372620',
    '--gold': '#C77B4F',
    '--gold-2': '#A85F35',
    '--gold-soft': '#E0A37E',
    '--cream': '#F1E8DA',
    '--cream-2': '#E7DCC8',
    '--paper': '#F8F1E4',
    '--bone': '#FCF7ED',
    '--muted': 'rgba(31, 20, 16, 0.6)',
    '--line': 'rgba(31, 20, 16, 0.14)',
  },
  inkChampagne: {
    name: 'Ink & Champagne',
    '--ink': '#161616',
    '--ink-2': '#1F1F1F',
    '--ink-3': '#2A2A2A',
    '--gold': '#D8C088',
    '--gold-2': '#B8A067',
    '--gold-soft': '#E8D6A8',
    '--cream': '#F1ECDF',
    '--cream-2': '#E6DECB',
    '--paper': '#F8F4E8',
    '--bone': '#FCF9F0',
    '--muted': 'rgba(22, 22, 22, 0.62)',
    '--line': 'rgba(22, 22, 22, 0.12)',
  },
};

// =============================================================
// Nav (with mobile drawer)
// =============================================================
function Nav({ current, onNavigate, logoVariant }) {
  const [open, setOpen] = useStateApp(false);
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Loan products' },
    { id: 'about', label: 'About' },
    { id: 'apply', label: 'Apply' },
  ];
  const go = (id) => { setOpen(false); onNavigate(id); };
  useEffectApp(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  return (
    <>
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <div className="nav-logo" onClick={() => go('home')}>
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <div className="nav-links nav-links-desktop">
              {links.map(l => (
                <a key={l.id} className={`nav-link ${current === l.id ? 'active' : ''}`} onClick={() => go(l.id)}>
                  {l.label}
                </a>
              ))}
            </div>
            <div className="nav-cta">
              <a href="tel:0439300621" className="nav-phone tabular nav-phone-desktop">0439 300 621</a>
              <a className="btn primary nav-cta-btn" onClick={() => go('apply')}>
                <span className="nav-cta-text-long">Pre-approval</span>
                <span className="nav-cta-text-short">Apply</span>
                <span className="arrow">→</span>
              </a>
              <button className={`nav-burger ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)} aria-label="Menu" aria-expanded={open}>
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className={`nav-drawer ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <div className="nav-drawer-inner" onClick={e => e.stopPropagation()}>
          <div className="nav-drawer-head">
            <div onClick={() => go('home')}>
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <button className="nav-drawer-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="nav-drawer-links">
            {links.map((l, i) => (
              <a key={l.id} className={`nav-drawer-link ${current === l.id ? 'active' : ''}`} onClick={() => go(l.id)}>
                <span className="num">{['i','ii','iii','iv'][i]}.</span>
                <span className="lbl">{l.label}</span>
                <span className="arrow">→</span>
              </a>
            ))}
          </div>
          <div className="nav-drawer-foot">
            <span className="eyebrow on-dark"><span className="dot"></span>Speak to a broker</span>
            <a href="tel:0439300621" className="nav-drawer-phone">0439 300 621</a>
            <a href="mailto:leonie@thebuyerassist.com.au" className="nav-drawer-email">leonie@thebuyerassist.com.au</a>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================
// Footer
// =============================================================
function Footer({ onNavigate, logoVariant }) {
  return (
    <footer className="footer">
      <div className="container">
        <h2 className="footer-tagline">
          Bespoke<br/>finance,<br/><em>quietly</em> done.
        </h2>

        <div className="footer-grid">
          <div>
            <div onClick={() => onNavigate('home')} style={{ cursor: 'pointer', marginBottom: 24 }}>
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <p className="body on-dark" style={{ maxWidth: '32ch', fontSize: 14 }}>
              The Buyer Assist Group · A boutique brokerage operating across Australia from our Brisbane office.
            </p>
            <div style={{ marginTop: 24, fontSize: 13, lineHeight: 1.6, color: 'rgba(245,241,232,0.7)' }}>
              <div>WOTSO Westfield Chermside</div>
              <div>Chermside QLD 4032</div>
              <div style={{ marginTop: 12 }}>ABN 63 680 292 399</div>
            </div>
          </div>
          <div>
            <h5>Navigate</h5>
            <div className="footer-links">
              <a onClick={() => onNavigate('home')}>Home</a>
              <a onClick={() => onNavigate('services')}>Loan products</a>
              <a onClick={() => onNavigate('about')}>About</a>
              <a onClick={() => onNavigate('apply')}>Apply</a>
              <a>FAQ</a>
              <a>Privacy</a>
            </div>
          </div>
          <div>
            <h5>Connect</h5>
            <div className="footer-links">
              <a href="tel:0439300621">0439 300 621</a>
              <a href="mailto:leonie@thebuyerassist.com.au">leonie@thebuyerassist.com.au</a>
              <a>LinkedIn</a>
              <a>Instagram</a>
            </div>
          </div>
          <div>
            <h5>Regulatory</h5>
            <div className="footer-links">
              <a>ACR 564090</a>
              <a>ACR 564090</a>
              <a>FBAA M-358724</a>
              <a>AFCA 111126</a>
            </div>
          </div>
        </div>

        <div className="footer-meta">
          <div>© 2026 The Buyer Assist Group. All rights reserved.</div>
          <div className="credit">
            Site concept by <span style={{ borderBottom: '1px solid var(--gold)' }}>Broken Mind Software</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================
// App
// =============================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "navyGold",
  "heroVariant": "portrait",
  "logoVariant": "proposed"
}/*EDITMODE-END*/;

function App() {
  const [page, setPage] = useStateApp('home');
  const [pageState, setPageState] = useStateApp({});
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply palette tokens to :root
  useEffectApp(() => {
    const p = PALETTES[t.palette] || PALETTES.navyGold;
    const root = document.documentElement;
    Object.entries(p).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
  }, [t.palette]);

  const onNavigate = (next, state = {}) => {
    setPage(next);
    setPageState(state);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Apply page is full-bleed (no nav/footer)
  if (page === 'apply') {
    return (
      <>
        <ApplyPage initialLoan={pageState.loan} onNavigate={onNavigate} />
        <TweaksControls t={t} setTweak={setTweak}/>
      </>
    );
  }

  return (
    <>
      <Nav current={page} onNavigate={onNavigate} logoVariant={t.logoVariant}/>
      {page === 'home' && <HomePage heroVariant={t.heroVariant} palette={t.palette} onNavigate={onNavigate}/>}
      {page === 'services' && <ServicesPage onNavigate={onNavigate}/>}
      {page === 'about' && <AboutPage onNavigate={onNavigate}/>}
      <Footer onNavigate={onNavigate} logoVariant={t.logoVariant}/>
      <TweaksControls t={t} setTweak={setTweak}/>
    </>
  );
}

function TweaksControls({ t, setTweak }) {
  const paletteKeys = Object.keys(PALETTES);
  const paletteArrays = paletteKeys.map(k => [PALETTES[k]['--ink'], PALETTES[k]['--gold'], PALETTES[k]['--cream']]);
  const currentArr = paletteArrays[Math.max(0, paletteKeys.indexOf(t.palette))];
  const currentName = PALETTES[t.palette]?.name || PALETTES.navyGold.name;

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand identity" />
      <TweakRadio
        label="Logo mark"
        value={t.logoVariant}
        options={[
          { value: 'existing', label: 'Existing' },
          { value: 'proposed', label: 'Proposed' },
        ]}
        onChange={v => setTweak('logoVariant', v)}
      />
      <TweakSection label="Color palette" />
      <TweakColor
        label={currentName}
        value={currentArr}
        options={paletteArrays}
        onChange={(arr) => {
          const k = JSON.stringify(arr);
          const idx = paletteArrays.findIndex(a => JSON.stringify(a) === k);
          if (idx >= 0) setTweak('palette', paletteKeys[idx]);
        }}
      />
      <TweakSection label="Hero composition" />
      <TweakRadio
        label="Layout"
        value={t.heroVariant}
        options={[
          { value: 'portrait', label: 'Portrait — Leonie' },
          { value: 'cinematic', label: 'Cinematic landscape' },
          { value: 'split', label: 'Split — automotive' },
          { value: 'editorial', label: 'Editorial — type-led' },
        ]}
        onChange={v => setTweak('heroVariant', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
