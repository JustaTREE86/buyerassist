/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// =============================================================
// Photography URLs (Unsplash, cinematic Australian-life themed)
// =============================================================
const PHOTOS = {
  // Hero: a wide cinematic Australian shot — coastline / car combo
  heroCoast: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=80&auto=format&fit=crop',
  heroCar: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&q=80&auto=format&fit=crop', // luxury car
  heroBusiness: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=2400&q=80&auto=format&fit=crop', // handshake
  heroCaravan: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=2400&q=80&auto=format&fit=crop',

  // Products
  car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80&auto=format&fit=crop',
  personal: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop',
  commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&auto=format&fit=crop',
  medical: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80&auto=format&fit=crop',
  business: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop',
  leisure: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200&q=80&auto=format&fit=crop',
  credit: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop',

  // Feature blocks
  brisbane: 'https://images.unsplash.com/photo-1756805104140-eade12344ef7?w=1800&q=80&auto=format&fit=crop',
  client: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80&auto=format&fit=crop',
  leonie: '/assets/leonie.jpg',
  leonieBespoke: '/assets/leonie-bespoke.jpg',
  founder: '/assets/leonie.jpg',
  team1: '/assets/leonie.jpg',
  josh: '/assets/josh.jpg',
  meno: '/assets/meno.jpg',
  nick: '/assets/nick.jpg',
  // Supplied brand photography (Leonie + Wipe Credit Clean)
  leonieDirector: '/assets/leonie-director.jpg',
  larniWcc: '/assets/larni-wcc.jpg',
  creditRepairFeature: '/assets/credit-repair-feature.jpg',
};

// =============================================================
// Loan products data
// =============================================================
const LOANS = [
  { id: 'car',        roman: 'I',    name: 'Asset & Car Loans', desc: 'New and used vehicles — competitive rates, flexible terms, dealership-direct settlement.', icon: 'car',     photo: PHOTOS.car },
  { id: 'personal',   roman: 'II',   name: 'Personal Loans',    desc: 'Unsecured finance for life\'s plans — consolidation, renovations, the unexpected.',     icon: 'wallet',  photo: PHOTOS.personal },
  { id: 'commercial', roman: 'III',  name: 'Commercial Loans',  desc: 'Expansion capital, equipment, working capital — secured against your business assets.', icon: 'building',photo: PHOTOS.commercial },
  { id: 'medical',    roman: 'IV',   name: 'Medical Equipment', desc: 'Finance for laser, body contouring, dental, imaging — tailored to the asset.',         icon: 'stethoscope', photo: PHOTOS.medical },
  { id: 'equipment',  roman: 'V',    name: 'Equipment Loans',   desc: 'Finance for business equipment, machinery and plant — tools, forklifts, fit-outs and more.', icon: 'cog',    photo: PHOTOS.commercial },
  { id: 'business',   roman: 'VI',   name: 'Business Loans',    desc: 'Start, scale, or steady the cash flow — secured or unsecured, fast turnaround.',       icon: 'briefcase',photo: PHOTOS.business },
  { id: 'leisure',    roman: 'VII',  name: 'Leisure Assets',    desc: 'Boats, caravans, jet skis, motorhomes — finance the better weekend.',                  icon: 'boat',     photo: PHOTOS.leisure },
  { id: 'credit',     roman: 'VIII', name: 'Credit Repair',     desc: 'With our partner Wipe Credit Clean — look into credit file issues that may be holding you back. A separate service; no outcome guaranteed.',    icon: 'shield',   photo: PHOTOS.credit },
];

// =============================================================
// SVG Icon set (line, gold accent)
// =============================================================
function Icon({ name, size = 32 }) {
  const s = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const v = "0 0 32 32";
  switch (name) {
    case 'car':
      return (<svg viewBox={v} {...s}><path d="M5 19v3a1 1 0 001 1h2a1 1 0 001-1v-1m18 1v-3m0 4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1m4-3H5m22 0v-5l-2.5-5H7.5L5 14v5m4 0a2 2 0 11-4 0 2 2 0 014 0zm18 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>);
    case 'wallet':
      return (<svg viewBox={v} {...s}><path d="M5 9a2 2 0 012-2h17a2 2 0 012 2v3m0 0H7a2 2 0 00-2 2v9a2 2 0 002 2h17a2 2 0 002-2v-9zm-5 4.5h.01M21 16.5a.5.5 0 11-1 0 .5.5 0 011 0z"/></svg>);
    case 'building':
      return (<svg viewBox={v} {...s}><path d="M6 27V8l10-3 10 3v19M6 27h20M11 13h2m6 0h2M11 18h2m6 0h2M11 23h2m6 0h2M14 27v-4h4v4"/></svg>);
    case 'stethoscope':
      return (<svg viewBox={v} {...s}><path d="M8 5v8a6 6 0 0012 0V5M11 5H5m9 0h6m-6 16a4 4 0 014 4v0a4 4 0 11-8 0v-1"/></svg>);
    case 'briefcase':
      return (<svg viewBox={v} {...s}><path d="M5 12a2 2 0 012-2h18a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V12zm7-2V7a2 2 0 012-2h4a2 2 0 012 2v3M5 17h22"/></svg>);
    case 'boat':
      return (<svg viewBox={v} {...s}><path d="M4 22c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M6 19l1.5-5h17L26 19M16 14V6m-5 0h10"/></svg>);
    case 'shield':
      return (<svg viewBox={v} {...s}><path d="M16 4l10 4v8c0 6-4 10-10 12-6-2-10-6-10-12V8l10-4zM12 16l3 3 6-6"/></svg>);
    case 'cog':
      return (<svg viewBox={v} {...s}><circle cx="16" cy="16" r="3.5"/><path d="M16 3.5v3.2m0 18.6v3.2M3.5 16h3.2m18.6 0h3.2M7.15 7.15l2.26 2.26m13.18 13.18l2.26 2.26m0-17.7l-2.26 2.26M9.41 22.59l-2.26 2.26"/></svg>);
    case 'phone':
      return (<svg viewBox={v} {...s}><path d="M22 21v3a2 2 0 01-2 2A18 18 0 014 10a2 2 0 012-2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2L10 16a14 14 0 006 6l1.6-1.1a2 2 0 012-.5c.9.3 1.8.5 2.7.6A2 2 0 0122 21z"/></svg>);
    case 'arrow':
      return (<svg viewBox={v} {...s}><path d="M5 16h22M19 8l8 8-8 8"/></svg>);
    case 'chat':
      return (<svg viewBox={v} {...s}><path d="M27 18a3 3 0 01-3 3H12l-6 5V8a3 3 0 013-3h15a3 3 0 013 3v10z"/><path d="M11 13h10M11 17h6"/></svg>);
    default: return null;
  }
}

// =============================================================
// Logos
// =============================================================
// Real BAG brand logo (PNG from the official Logo Suite).
// `light` picks the white mark for dark backgrounds, navy for light ones.
function BrandLogo({ light = true, size = 'md' }) {
  const h = size === 'lg' ? 56 : size === 'sm' ? 28 : 38;
  const src = light ? '/assets/bag-logo-white.png' : '/assets/bag-logo-navy.png';
  return (
    <img
      src={src}
      alt="The Buyer Assist Group"
      className="brand-logo"
      style={{ height: h, width: 'auto', display: 'block' }}
    />
  );
}
// Back-compat aliases — both logo "variants" now render the real brand logo.
function LogoExisting(props) { return <BrandLogo {...props} />; }
function LogoProposed(props) { return <BrandLogo {...props} />; }

// =============================================================
// Social links
// =============================================================
const SOCIALS = [
  { id: 'facebook',  label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61570035414441' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/finance.wife/' },
  { id: 'linkedin',  label: 'LinkedIn',  href: 'https://www.linkedin.com/in/thebuyerassistgroup/' },
];

function SocialIcon({ name, size = 18 }) {
  const s = { width: size, height: size, fill: 'currentColor' };
  switch (name) {
    case 'facebook':
      return (<svg viewBox="0 0 24 24" {...s}><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z"/></svg>);
    case 'instagram':
      return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: size, height: size }}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>);
    case 'linkedin':
      return (<svg viewBox="0 0 24 24" {...s}><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4 0 4.75 2.65 4.75 6.1V21H18.6v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21H10z"/></svg>);
    case 'whatsapp':
      return (<svg viewBox="0 0 24 24" {...s}><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.04c-.24.68-1.42 1.32-1.95 1.37-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.04.9 2.19.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.21 1.36.28.14.44.12.6-.07.16-.19.69-.81.88-1.08.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.14.46.21.53.32.07.12.07.66-.17 1.33z"/></svg>);
    default: return null;
  }
}

// =============================================================
// Contact details  (single source of truth)
// =============================================================
const CONTACT = {
  phoneDisplay: '07 5613 1905',
  phoneTel: '+61756131905',
  whatsapp: null,
  whatsappMsg: null,
  email: 'connect@thebuyerassist.com.au',
  messenger: 'https://m.me/thebuyerassistgroup',
  addressLine1: 'WOTSO, 395 Hamilton Rd',
  addressLine2: 'Chermside QLD 4032',
  // ---- Lead delivery -------------------------------------------------------
  // Finance applications no longer come through here — every loan CTA links
  // straight to an AFOS quick-quote page (see AFOS_LINKS below), which lands
  // directly in Leonie's AFOS CRM. Only the Credit Repair Enquiry and the
  // "become a referral partner" form still POST here, which forwards to Make
  // and on into GoHighLevel. Do NOT point this back at Formspree: it silently
  // classified loan enquiries as spam, answering HTTP 200 {"ok":true} while
  // binning the lead, so the browser could not tell delivery from loss. A
  // generic spam filter will always fight finance wording. See decisions/log.md.
  formEndpoint: '/api/lead',
};

// =============================================================
// AFOS quick-quote links — every loan-type CTA sends the visitor straight
// here instead of through our own form. AFOS owns the field collection and
// drops the lead directly into Leonie's CRM. Where a loan type has no
// dedicated AFOS link, we route to the personal loans quick-quote (relabelled
// on the button) rather than invent a URL AFOS doesn't have.
// =============================================================
const AFOS_PORTAL_URL = 'https://thebuyerassist.afos.io';
const AFOS_LINKS = {
  car: 'https://thebuyerassist.afos.io/car-loans/quick-quote',
  personal: 'https://thebuyerassist.afos.io/personal-loans/quick-quote',
  commercial: 'https://thebuyerassist.afos.io/commercial-finance/quick-quote',
  business: 'https://thebuyerassist.afos.io/business-loans/quick-quote',
  leisure: 'https://thebuyerassist.afos.io/leisure-finance/quick-quote',
  caravan: 'https://thebuyerassist.afos.io/caravan-finance/quick-quote',
  motorbike: 'https://thebuyerassist.afos.io/bike-finance/quick-quote',
  boat: 'https://thebuyerassist.afos.io/boat-finance/quick-quote',
  // No dedicated AFOS quick-quote yet — personal loans is the closest fit.
  medical: 'https://thebuyerassist.afos.io/personal-loans/quick-quote',
  equipment: 'https://thebuyerassist.afos.io/personal-loans/quick-quote',
  'debt-consolidation': 'https://thebuyerassist.afos.io/personal-loans/quick-quote',
};
function afosLink(loanId) {
  return AFOS_LINKS[loanId] || AFOS_PORTAL_URL;
}

// =============================================================
// Shared form helpers, document checklists & compliance copy
// =============================================================

// Documents relevant to a credit repair enquiry.
const CREDIT_REPAIR_DOCS = [
  'Credit reports',
  'Default notices',
  'Correspondence from creditors',
  'Identification',
  'Previous dispute responses',
  'Any supporting evidence',
];

// Australian phone validation. Accepts mobiles (04xx xxx xxx), landlines
// (0x xxxx xxxx) and +61 prefixes, ignoring spaces, brackets and dashes.
function isValidAUPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('61')) d = '0' + d.slice(2);
  return /^0[2-478]\d{8}$/.test(d);
}

function isValidEmail(v) {
  return /^\S+@\S+\.\S+$/.test(String(v || '').trim());
}

// Posts an enquiry to /api/lead. Returns true only when the server confirms the
// lead reached Make, so callers can offer a mailto fallback otherwise. Checking
// res.ok alone is not enough: the endpoint answers 200 for a honeypot hit, and
// the Formspree service this replaced returned 200 while discarding the lead.
// Treat anything short of an explicit {ok:true} as undelivered.
async function submitEnquiry(payload) {
  if (!CONTACT.formEndpoint) return false;
  try {
    const res = await fetch(CONTACT.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ ...payload, sourceUrl: window.location.href }),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && json.ok === true;
  } catch (e) {
    return false;
  }
}

// =============================================================
// Floating quick-contact stack  (follows the user down the page)
// =============================================================
function FloatingActions() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`fab-stack ${open ? 'open' : ''}`} role="group" aria-label="Quick contact">
      <a className="fab fab-action fab-call" href={`tel:${CONTACT.phoneTel}`} aria-label="Call now" tabIndex={open ? 0 : -1}>
        <Icon name="phone" size={22}/>
        <span className="fab-tip">Call now</span>
      </a>
      <a className="fab fab-action fab-chat" href={CONTACT.messenger} target="_blank" rel="noopener noreferrer" aria-label="Chat on Facebook Messenger" tabIndex={open ? 0 : -1}>
        <SocialIcon name="facebook" size={24}/>
        <span className="fab-tip">Messenger</span>
      </a>
      <button className={`fab fab-toggle ${open ? 'is-open' : ''}`} onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={open ? 'Close contact menu' : 'Contact us'}>
        {open ? <span className="fab-close">✕</span> : <Icon name="chat" size={26}/>}
      </button>
    </div>
  );
}

// =============================================================
// Broker profiles  (single source of truth for team data)
// =============================================================
const BROKERS = [
  {
    id: 'leonie',
    name: 'Leonie',
    role: 'Director · The Buyer Assist Group',
    tag: 'Director',
    photo: 'leonie',
    email: 'leonie@thebuyerassist.com.au',
    linkedin: null,
    instagram: null,
    facebook: null,
    bio: 'Leonie founded The Buyer Assist Group after 17 years in the automotive industry, with one conviction: every client deserves a straight answer, not a sales pitch. She leads the team\'s approach to file writing, lender relationships, and responsible credit. If you\'ve been knocked back before, Leonie is the person you call.',
    specialties: ['Asset Finance', 'Personal Loans', 'Commercial Finance', 'Business Loans', 'Credit Repair'],
  },
  {
    id: 'josh',
    name: 'Josh',
    role: 'Senior Finance Broker',
    tag: 'Senior Broker',
    photo: 'josh',
    email: 'josh@thebuyerassist.com.au',
    linkedin: null,
    instagram: null,
    facebook: null,
    bio: 'Josh brings a decade of hands-on brokering to every file, with experience across Credit One and Aussie Loans before joining The Buyer Assist Group. He specialises in car and asset finance, equipment, personal loans, and unsecured business lending. Josh\'s approach is direct: he\'ll tell you what the numbers look like before you apply, and he won\'t waste your time chasing a deal that isn\'t there.',
    specialties: ['Car & Asset Finance', 'Equipment Finance', 'Personal Loans', 'Business Loans'],
  },
  {
    id: 'meno',
    name: 'Meno',
    role: 'Consumer & Commercial Finance Broker',
    tag: 'Consumer & Commercial',
    photo: 'meno',
    email: 'meno@thebuyerassist.com.au',
    linkedin: null,
    instagram: null,
    facebook: null,
    bio: 'Meno handles consumer and commercial finance across a wide range of loan types, from personal and car loans through to commercial assets and equipment. He brings a methodical approach to each file and a genuine interest in finding the right structure for his clients, not just the fastest approval.',
    specialties: ['Consumer Finance', 'Car & Asset Finance', 'Commercial Lending', 'Equipment Finance'],
  },
  {
    id: 'nick',
    name: 'Nick',
    role: 'Consumer & Commercial Finance Broker',
    tag: 'Consumer & Commercial',
    photo: 'nick',
    email: 'nick@thebuyerassist.com.au',
    linkedin: null,
    instagram: null,
    facebook: null,
    bio: 'Nick works across consumer and commercial lending, helping clients navigate everything from personal finance to business equipment and vehicle loans. He\'s known for clear communication and keeping clients informed at every stage of the process, from the first call through to settlement.',
    specialties: ['Consumer Finance', 'Car & Asset Finance', 'Commercial Lending', 'Equipment Finance'],
  },
];

// =============================================================
// Accreditations  (placeholder badges — real logos to be supplied)
// =============================================================
const ACCREDITATIONS = [
  { id: 'fbaa', label: 'FBAA', sub: 'Member M-358724', logo: '/assets/fbaa-logo.png' },
  { id: 'afca', label: 'AFCA', sub: 'Member 111126', logo: '/assets/afca-logo.png' },
  { id: 'acr',  label: 'Credit Rep', sub: 'ACR 564090', logo: '/assets/optimise-logo.jpg' },
  { id: 'panel', label: '50+ Lenders', sub: 'Independent panel' },
];

// =============================================================
// Format helpers
// =============================================================
function formatMoney(n) {
  return Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
}
function repaymentPerWeek(principal, ratePct, years) {
  const r = (ratePct / 100) / 52;
  const n = years * 52;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

// Export to other scripts
Object.assign(window, {
  PHOTOS, LOANS, Icon, LogoExisting, LogoProposed, BrandLogo,
  SOCIALS, SocialIcon, ACCREDITATIONS, CONTACT, BROKERS, FloatingActions,
  formatMoney, repaymentPerWeek,
  AFOS_PORTAL_URL, AFOS_LINKS, afosLink,
  CREDIT_REPAIR_DOCS,
  isValidAUPhone, isValidEmail, submitEnquiry,
  useState, useEffect, useMemo, useRef,
});
