/* global React, ReactDOM, LogoExisting, LogoProposed, Icon, HomePage, ServicesPage, AboutPage, ApplyPage, BrokerProfilePage, PartnersPage, CreditRepairPage, CreditRepairEnquiryPage, PrivacyPage, ClientsPage, StaffDebtBustersPage, DealerKoCarsPage, AutozoneApplyPage, AutozoneStaffPage, KoApplyPage, PortalDemoPage, ReadyFinanceDemoPage, LOANS, afosLink, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor */
const { useState: useStateApp, useEffect: useEffectApp } = React;

// Makes an onClick element keyboard-operable (Enter/Space) and exposes it to
// assistive tech as a button. Spread onto <a>/<div> elements used as buttons.
const keyBtn = (fn) => ({
  role: 'button',
  tabIndex: 0,
  onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } },
});

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
// Routing — maps page ids to real URLs so pages deep-link, refresh,
// and use browser back/forward correctly (previously all navigation
// was in-memory only and every URL other than "/" fell back to Home).
// =============================================================
const ROUTES = [
  { id: 'home', path: '/' },
  { id: 'services', path: '/loan-products' },
  { id: 'about', path: '/about' },
  { id: 'partners', path: '/partners' },
  { id: 'credit-repair', path: '/credit-repair' },
  { id: 'credit-repair-enquiry', path: '/credit-repair/enquiry' },
  { id: 'clients', path: '/our-clients' },
  { id: 'privacy', path: '/privacy' },
  { id: 'apply', path: '/apply' },
  { id: 'staff-debt-busters', path: '/staff/debt-busters' },
  // Hidden dealer dashboards. Listed here so the URL resolves on a hard
  // refresh — deliberately not linked from Nav, the footer or the sitemap.
  { id: 'dealer-ko-cars', path: '/dealer/ko-cars' },
  // Josh's private commission tracker for Eve's cut — password-gated, not
  // linked from Nav, the footer or the sitemap.
  { id: 'eve', path: '/eve' },
  // Josh's personal AFOS quick-quote link, sent directly to his own clients —
  // not linked from Nav, the footer or the sitemap.
  { id: 'autozone-apply', path: '/autozone-apply' },
  // Same quick-quote embed as autozone-apply, at a clean vanity URL for Josh
  // to post publicly (Facebook, business cards, etc). Not linked from Nav,
  // the footer or the sitemap.
  { id: 'apply-josh', path: '/apply/josh' },
  // AutoZone QLD staff ad-copy tool — internal reference for the dealership,
  // not linked from Nav, the footer or the sitemap.
  { id: 'autozone-staff', path: '/autozone-staff' },
  // KO Cars twin of autozone-apply — the quick-quote link Charlie and the KO
  // Cars floor send to their customers. Not linked from Nav, the footer or
  // the sitemap.
  { id: 'ko-apply', path: '/ko-apply' },
  // Referral Partner Portal sales demo — the prototype Josh shows to other
  // brokers. Entirely invented data, no API, no login. Not linked from Nav,
  // the footer or the sitemap; the URL is handed out directly.
  { id: 'portal-demo', path: '/portal-demo' },
  // The same demo, pre-branded for one prospect: Ready Finance Group. Their
  // logo, their blue, a home loan pipeline, their kind of referrers. Handed to
  // Ben directly; not linked from Nav, the footer or the sitemap.
  { id: 'rf-demo', path: '/portal-demo/ready-finance' },
];

const TITLES = {
  home: 'The Buyer Assist Group — Bespoke finance, quietly done well.',
  services: 'Loan Products — The Buyer Assist Group',
  about: 'About — The Buyer Assist Group',
  partners: 'Our Partners — The Buyer Assist Group',
  'credit-repair': 'Credit Repair — The Buyer Assist Group',
  'credit-repair-enquiry': 'Credit Repair Enquiry — The Buyer Assist Group',
  clients: 'Our Clients — The Buyer Assist Group',
  privacy: 'Privacy & Credit Guide — The Buyer Assist Group',
  apply: 'Apply — The Buyer Assist Group',
  broker: 'Our Team — The Buyer Assist Group',
  'dealer-ko-cars': 'KO Cars Deal Tracker — The Buyer Assist Group',
  eve: 'Eve Split — The Buyer Assist Group',
  'autozone-apply': 'Quick Quote — The Buyer Assist Group',
  'apply-josh': 'Apply with Josh — The Buyer Assist Group',
  'autozone-staff': 'AutoZone Staff Ad Copy — The Buyer Assist Group',
  'ko-apply': 'KO Cars Quick Quote — The Buyer Assist Group',
  'portal-demo': 'Referral Partner Portal — demo',
  'rf-demo': 'Referral Partner Portal · Ready Finance Group demo',
};

function pathFor(page, state = {}) {
  if (page === 'broker') return `/team/${state.id || ''}`;
  const r = ROUTES.find(r => r.id === page);
  return r ? r.path : '/';
}

function parsePath(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/staff/debt-busters') return { page: 'staff-debt-busters', state: {} };
  if (clean === '/dealer/ko-cars') return { page: 'dealer-ko-cars', state: {} };
  if (clean === '/eve') return { page: 'eve', state: {} };
  if (clean.startsWith('/team/')) return { page: 'broker', state: { id: clean.slice('/team/'.length) } };
  const match = ROUTES.find(r => r.path === clean);
  return match ? { page: match.id, state: {} } : { page: 'home', state: {} };
}

// =============================================================
// Nav (with mobile drawer)
// =============================================================
function Nav({ current, onNavigate, logoVariant }) {
  const [open, setOpen] = useStateApp(false);
  const [hovered, setHovered] = useStateApp(null);

  const links = [
    { id: 'home', label: 'Home' },
    {
      id: 'services', label: 'Loan products',
      // Loan-specific items link straight to AFOS's quick-quote page, not
      // through our own /apply route — see afosLink (components.jsx).
      children: LOANS.map(l => (
        l.id === 'credit'
          ? { id: 'credit-repair', label: l.name }
          : { href: afosLink(l.id), label: l.name }
      )),
    },
    { id: 'about', label: 'About' },
    {
      id: 'partners', label: 'Our partners',
      children: [
        { id: 'partners', label: 'Partner network' },
        { id: 'partners', label: 'Work with us', state: { scrollTo: 'work-with-us' } },
      ],
    },
    { id: 'clients', label: 'Our clients' },
    { id: 'apply', label: 'Apply' },
  ];

  const go = (id, state) => { setOpen(false); setHovered(null); onNavigate(id, state || {}); };

  useEffectApp(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <div className="nav-logo" onClick={() => go('home')} {...keyBtn(() => go('home'))} aria-label="The Buyer Assist Group — home">
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <div className="nav-links nav-links-desktop">
              {links.map(l => (
                <div
                  key={l.label}
                  className="nav-item"
                  onMouseEnter={() => l.children && setHovered(l.label)}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={(e) => { if (l.children && !e.currentTarget.contains(e.relatedTarget)) setHovered(null); }}
                >
                  <a
                    className={`nav-link ${current === l.id ? 'active' : ''}`}
                    onClick={() => !l.children && go(l.id)}
                    {...keyBtn(() => l.children ? setHovered(v => v === l.label ? null : l.label) : go(l.id))}
                    onFocus={() => l.children && setHovered(l.label)}
                    aria-haspopup={l.children ? 'true' : undefined}
                    aria-expanded={l.children ? (hovered === l.label) : undefined}
                    style={{ cursor: 'pointer' }}
                  >
                    {l.label}
                    {l.children && <span className="nav-link-chevron">▾</span>}
                  </a>
                  {l.children && (
                    <div className={`nav-dropdown ${hovered === l.label ? 'open' : ''}`}>
                      <div className="nav-dropdown-inner">
                        {l.children.map((c, ci) => (
                          c.href ? (
                            <a key={ci} className="nav-dropdown-item" href={c.href}>
                              {c.label}
                            </a>
                          ) : (
                            <a key={ci} className="nav-dropdown-item" onClick={() => go(c.id, c.state)} {...keyBtn(() => go(c.id, c.state))}>
                              {c.label}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="nav-cta">
              <a href="tel:0756131905" className="nav-phone tabular nav-phone-desktop">07 5613 1905</a>
              <a className="btn primary nav-cta-btn" onClick={() => go('apply')} {...keyBtn(() => go('apply'))}>
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
            <div onClick={() => go('home')} {...keyBtn(() => go('home'))} aria-label="The Buyer Assist Group — home">
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <button className="nav-drawer-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="nav-drawer-links">
            {links.filter(l => l.id !== 'apply').map((l, i) => (
              <div key={l.label}>
                <a className={`nav-drawer-link ${current === l.id ? 'active' : ''}`} onClick={() => !l.children && go(l.id)} {...keyBtn(() => !l.children && go(l.id))}>
                  <span className="num">{['i','ii','iii','iv','v','vi'][i]}.</span>
                  <span className="lbl">{l.label}</span>
                  <span className="arrow">{l.children ? '' : '→'}</span>
                </a>
                {l.children && (
                  <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 2, marginTop: -8, marginBottom: 8 }}>
                    {l.children.map((c, ci) => (
                      c.href ? (
                        <a key={ci} href={c.href} style={{ fontSize: 15, color: 'rgba(245,241,232,0.6)', cursor: 'pointer', padding: '6px 0' }}>
                          {c.label}
                        </a>
                      ) : (
                        <a key={ci} onClick={() => go(c.id, c.state)} {...keyBtn(() => go(c.id, c.state))} style={{ fontSize: 15, color: 'rgba(245,241,232,0.6)', cursor: 'pointer', padding: '6px 0' }}>
                          {c.label}
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="nav-drawer-foot">
            <span className="eyebrow on-dark"><span className="dot"></span>Speak to a broker</span>
            <a href="tel:0756131905" className="nav-drawer-phone">07 5613 1905</a>
            <a href="mailto:connect@thebuyerassist.com.au" className="nav-drawer-email">connect@thebuyerassist.com.au</a>
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
            <div onClick={() => onNavigate('home')} {...keyBtn(() => onNavigate('home'))} aria-label="The Buyer Assist Group — home" style={{ cursor: 'pointer', marginBottom: 24 }}>
              {logoVariant === 'existing' ? <LogoExisting light={true}/> : <LogoProposed light={true}/>}
            </div>
            <p className="body on-dark" style={{ maxWidth: '32ch', fontSize: 14 }}>
              The Buyer Assist Group · A boutique brokerage operating across Australia from our Brisbane office.
            </p>
            <div style={{ marginTop: 24, fontSize: 13, lineHeight: 1.6, color: 'rgba(245,241,232,0.7)' }}>
              <div>WOTSO, 395 Hamilton Rd</div>
              <div>Chermside QLD 4032</div>
              <div style={{ marginTop: 12 }}>ABN 63 680 292 399</div>
            </div>
          </div>
          <div>
            <h5>Navigate</h5>
            <div className="footer-links">
              <a onClick={() => onNavigate('home')} {...keyBtn(() => onNavigate('home'))}>Home</a>
              <a onClick={() => onNavigate('services')} {...keyBtn(() => onNavigate('services'))}>Loan products</a>
              <a onClick={() => onNavigate('about')} {...keyBtn(() => onNavigate('about'))}>About</a>
              <a onClick={() => onNavigate('partners')} {...keyBtn(() => onNavigate('partners'))}>Partners</a>
              <a onClick={() => onNavigate('credit-repair')} {...keyBtn(() => onNavigate('credit-repair'))}>Credit repair</a>
              <a onClick={() => onNavigate('apply')} {...keyBtn(() => onNavigate('apply'))}>Apply</a>
              <a onClick={() => onNavigate('privacy')} {...keyBtn(() => onNavigate('privacy'))}>Privacy</a>
              <a onClick={() => onNavigate('staff-debt-busters')} {...keyBtn(() => onNavigate('staff-debt-busters'))} aria-label="Staff login">Staff login</a>
            </div>
          </div>
          <div>
            <h5>Connect</h5>
            <div className="footer-links">
              <a href="tel:0756131905">07 5613 1905</a>
              <a href="mailto:connect@thebuyerassist.com.au">connect@thebuyerassist.com.au</a>
              {SOCIALS.map(s => (
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
            <div className="footer-social">
              {SOCIALS.map(s => (
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  <SocialIcon name={s.id} size={18}/>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5>Regulatory</h5>
            <div className="footer-links footer-reg">
              <span>Credit Rep · 564090</span>
              <span>Australian Credit Licence · 414426</span>
              <span>FBAA · M-358724</span>
              <span>AFCA · 111126</span>
            </div>
          </div>
        </div>

        <p className="footer-disclaimer">
          The Buyer Assist Group is a trading name of Cullen Financial Services Pty Ltd (ABN 63 680 292 399, ACN 680 292 399). Credit Representative #564090 is authorised under Australian Credit Licence #414426, held by AFAS Group Pty Ltd (ABN 12 134 138 686). Member of the Finance Brokers Association of Australia (FBAA M-358724) and the Australian Financial Complaints Authority (AFCA 111126). Credit advice is provided under the National Consumer Credit Protection Act 2009 (NCCP). Any advice on this website is general in nature and does not take your personal circumstances into account. A Credit Guide and Credit Proposal Disclosure are provided before any credit assistance. Quotes and calculator results are indicative only and not an offer of finance. All finance applications are subject to lender approval and responsible lending assessment. Lending criteria, fees, terms and conditions apply.
        </p>

        <div className="footer-meta">
          <div>© 2026 The Buyer Assist Group. All rights reserved.</div>
          <div className="credit">
            Powered by <a href="https://brokenmind.com.au" target="_blank" rel="noopener noreferrer">Broken Mind Software</a>
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
  const initial = React.useMemo(() => parsePath(window.location.pathname), []);
  const [page, setPage] = useStateApp(initial.page);
  const [pageState, setPageState] = useStateApp(initial.state);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply palette tokens to :root
  useEffectApp(() => {
    const p = PALETTES[t.palette] || PALETTES.navyGold;
    const root = document.documentElement;
    Object.entries(p).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
  }, [t.palette]);

  useEffectApp(() => {
    document.title = TITLES[page] || TITLES.home;
  }, [page]);

  // Keep in-memory route in sync with the browser's back/forward buttons.
  useEffectApp(() => {
    const onPop = () => {
      const parsed = parsePath(window.location.pathname);
      setPage(parsed.page);
      setPageState(parsed.state);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const onNavigate = (next, state = {}) => {
    setPage(next);
    setPageState(state);
    const path = pathFor(next, state);
    if (window.location.pathname + window.location.search !== path) {
      history.pushState({ page: next, state }, '', path);
    }
    if (state.scrollTo) {
      // Smooth-scroll to a section on the destination page. The target may not
      // be mounted yet when navigating in from another page, so poll a few
      // frames for it before falling back to the top.
      const id = state.scrollTo;
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (tries++ < 20) requestAnimationFrame(tryScroll);
        else window.scrollTo({ top: 0, behavior: 'auto' });
      };
      requestAnimationFrame(tryScroll);
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  // Hidden staff page is fully isolated — no nav/footer, no tweaks panel,
  // and never rendered inside the public site chrome.
  if (page === 'staff-debt-busters') {
    return <StaffDebtBustersPage/>;
  }

  // Hidden dealer dashboard — same isolation as the staff page: no nav,
  // footer, floating contact buttons or tweaks panel, and no public chrome
  // that could link back out to the marketing site.
  if (page === 'dealer-ko-cars') {
    return <DealerKoCarsPage/>;
  }

  // Josh's private commission tracker for Eve's cut — same isolation: no nav,
  // footer, floating buttons or tweaks panel, and no public chrome.
  if (page === 'eve') {
    return <EveTrackerPage/>;
  }

  // Josh's personal quick-quote embed — same isolation: nothing that leads
  // a client back into the marketing site or the tweaks panel.
  if (page === 'autozone-apply') {
    return <AutozoneApplyPage/>;
  }

  // Same embed as autozone-apply, at the /apply/josh vanity URL Josh shares
  // publicly. Same isolation: no nav, footer, floating buttons or tweaks panel.
  if (page === 'apply-josh') {
    return <AutozoneApplyPage/>;
  }

  // AutoZone QLD staff ad-copy tool — isolated internal page, no public chrome.
  if (page === 'autozone-staff') {
    return <AutozoneStaffPage/>;
  }

  // KO Cars quick-quote embed — same isolation as autozone-apply: nothing
  // that leads a KO customer back into the marketing site or the tweaks panel.
  if (page === 'ko-apply') {
    return <KoApplyPage/>;
  }

  // Referral Partner Portal sales demo. Isolated like the other hidden pages:
  // a prospect being shown a product should never see Buyer Assist's nav,
  // footer or tweaks panel around it.
  if (page === 'portal-demo') {
    return <PortalDemoPage/>;
  }

  // Same demo, pre-branded for Ready Finance Group. Isolated for the same
  // reason: Ben should see his own portal, not Buyer Assist's chrome around it.
  if (page === 'rf-demo') {
    return <ReadyFinanceDemoPage/>;
  }

  // Apply page is full-bleed (no nav/footer)
  if (page === 'apply') {
    return (
      <>
        <ApplyPage onNavigate={onNavigate} />
        <FloatingActions onNavigate={onNavigate}/>
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
      {page === 'partners' && <PartnersPage onNavigate={onNavigate}/>}
      {page === 'credit-repair' && <CreditRepairPage onNavigate={onNavigate}/>}
      {page === 'credit-repair-enquiry' && <CreditRepairEnquiryPage onNavigate={onNavigate}/>}
      {page === 'broker' && <BrokerProfilePage id={pageState.id} onNavigate={onNavigate}/>}
      {page === 'clients' && <ClientsPage onNavigate={onNavigate}/>}
      {page === 'privacy' && <PrivacyPage />}
      <Footer onNavigate={onNavigate} logoVariant={t.logoVariant}/>
      <FloatingActions onNavigate={onNavigate}/>
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
