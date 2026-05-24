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
  brisbane: 'https://images.unsplash.com/photo-1566734904496-9309bb1798ae?w=1600&q=80&auto=format&fit=crop',
  client: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80&auto=format&fit=crop',
  leonie: 'photos/leonie.avif', // Principal Broker — Leonie
  founder: 'photos/leonie.avif',
  team1: 'photos/leonie.avif',
  team2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&q=80&auto=format&fit=crop',
  team3: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1000&q=80&auto=format&fit=crop',
};

// =============================================================
// Loan products data
// =============================================================
const LOANS = [
  { id: 'car',        roman: 'I',    name: 'Asset & Car Loans', desc: 'New and used vehicles — competitive rates, flexible terms, dealership-direct settlement.', icon: 'car',     photo: PHOTOS.car },
  { id: 'personal',   roman: 'II',   name: 'Personal Loans',    desc: 'Unsecured finance for life\'s plans — consolidation, renovations, the unexpected.',     icon: 'wallet',  photo: PHOTOS.personal },
  { id: 'commercial', roman: 'III',  name: 'Commercial Loans',  desc: 'Expansion capital, equipment, working capital — secured against your business assets.', icon: 'building',photo: PHOTOS.commercial },
  { id: 'medical',    roman: 'IV',   name: 'Medical Equipment', desc: 'Finance for laser, body contouring, dental, imaging — tailored to the asset.',         icon: 'stethoscope', photo: PHOTOS.medical },
  { id: 'business',   roman: 'V',    name: 'Business Loans',    desc: 'Start, scale, or steady the cash flow — secured or unsecured, fast turnaround.',       icon: 'briefcase',photo: PHOTOS.business },
  { id: 'leisure',    roman: 'VI',   name: 'Leisure Assets',    desc: 'Boats, caravans, jet skis, motorhomes — finance the better weekend.',                  icon: 'boat',     photo: PHOTOS.leisure },
  { id: 'credit',     roman: 'VII',  name: 'Credit Repair',     desc: 'In partnership with Wipe Credit Clean — restore your score, unlock better rates.',    icon: 'shield',   photo: PHOTOS.credit },
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
    case 'phone':
      return (<svg viewBox={v} {...s}><path d="M22 21v3a2 2 0 01-2 2A18 18 0 014 10a2 2 0 012-2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2L10 16a14 14 0 006 6l1.6-1.1a2 2 0 012-.5c.9.3 1.8.5 2.7.6A2 2 0 0122 21z"/></svg>);
    case 'arrow':
      return (<svg viewBox={v} {...s}><path d="M5 16h22M19 8l8 8-8 8"/></svg>);
    default: return null;
  }
}

// =============================================================
// Logos
// =============================================================
function LogoExisting({ light = true }) {
  // The existing BAG logo — recreated as a stacked monogram
  return (
    <div className="logo-existing" style={{ color: light ? 'var(--cream)' : 'var(--ink)' }}>
      <span className="bag">B</span>
      <span className="name">
        Buyer Assist <span className="light">Group</span>
      </span>
    </div>
  );
}

function LogoProposed({ light = true, size = 'md' }) {
  // Proposed: a serif monogram inside a circle with a refined ampersand-style mark
  const dim = size === 'lg' ? 56 : size === 'sm' ? 24 : 32;
  const fontSize = size === 'lg' ? 30 : size === 'sm' ? 14 : 18;
  return (
    <div className="logo-proposed" style={{ color: light ? 'var(--cream)' : 'var(--ink)' }}>
      <span className="mark" style={{ width: dim, height: dim }}>
        <svg viewBox="0 0 48 48" width={dim} height={dim} aria-label="BAG mark">
          <circle cx="24" cy="24" r="23" fill="none" stroke="currentColor" strokeWidth="1"/>
          <circle cx="24" cy="24" r="19" fill="none" stroke="var(--gold)" strokeWidth="0.6" opacity="0.6"/>
          <text x="24" y="30" textAnchor="middle" fontFamily="Newsreader, serif" fontStyle="italic" fontWeight="300" fontSize="20" fill="var(--gold)">b</text>
          <text x="24" y="30" textAnchor="middle" fontFamily="Newsreader, serif" fontStyle="italic" fontWeight="300" fontSize="20" fill="currentColor" opacity="0.0">b</text>
        </svg>
      </span>
      <span className="wordmark" style={{ fontSize }}>
        Buyer<span className="amp"> · </span>Assist
      </span>
    </div>
  );
}

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
  PHOTOS, LOANS, Icon, LogoExisting, LogoProposed,
  formatMoney, repaymentPerWeek,
  useState, useEffect, useMemo, useRef,
});
