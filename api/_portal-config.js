// Who can sign in to each Referral Partner Portal, and as what.
//
// Adding a person = add a row here, set the matching env var in Vercel
// (Production AND Preview), tell them their password. Nothing else changes:
// login.js, session.js and deals.js all read this list.
//
// Three roles:
//
//   owner    Josh / Buyer Assist. Reaches every org, read and write. This is
//            the support login, not a login any client is given.
//   staff    The brokerage running the portal (Ben, Alana at Ready Finance).
//            Read and write on their own org's board only.
//   partner  A referral firm (an agency, a conveyancer). Scoped to the deals
//            they referred — enforced by the query in _portal-db.js, not by
//            hiding rows in the browser. They can post a message on one of
//            their own deals, and nothing else.
//
// Owner and staff passwords exist only as env vars on the server. They are
// never sent to the browser, never stored in the database, and never written
// down here.
//
// REFERRAL FIRMS ARE NOT CONFIGURED HERE ANY MORE
// -----------------------------------------------
// They live in portal_partners with a hashed, app-generated access code, so
// the brokerage can add one without a deploy. See api/_portal-codes.js and
// api/_portal-routes/partners.js.
//
// The `partners` list below is the legacy path, kept for the four firms seeded
// before that change. Each entry works ONLY while that firm has no code of its
// own — login.js checks, and once a code is issued the env var stops being a
// way in. Do not add to this list; add the firm on the board instead.
//
// A partner row's `slug` must match a portal_partners.slug for that org (see
// the migration). If it does not, that login is refused at sign-in rather
// than silently landing on an empty board.
const PORTAL_ROLE_OWNER = 'owner';
const PORTAL_ROLE_STAFF = 'staff';
const PORTAL_ROLE_PARTNER = 'partner';

// Josh's own password, valid on every org. Deliberately a single var rather
// than one per org: it is the support key, and one of it is easier to rotate.
const OWNER_PASSWORD_ENV = 'PORTAL_OWNER_PASSWORD';

const PORTAL_LOGINS = {
  'ready-finance': {
    staff: [
      { passwordEnv: 'RF_PORTAL_BEN_PASSWORD', name: 'Ben' },
      { passwordEnv: 'RF_PORTAL_ALANA_PASSWORD', name: 'Alana' },
    ],
    // LEGACY. `name` is the person at that firm, used to sign their notes and
    // fill the header. The firm's own name and colour come from
    // portal_partners, so rebranding a partner never touches this file.
    //
    // These four are the invented demo firms. Once Ready Finance's real
    // referrers are on the board these rows and their env vars both go.
    partners: [
      { slug: 'coastline', passwordEnv: 'RF_PORTAL_COASTLINE_PASSWORD', name: 'Elise' },
      { slug: 'ashgrove', passwordEnv: 'RF_PORTAL_ASHGROVE_PASSWORD', name: 'Cameron' },
      { slug: 'meridian', passwordEnv: 'RF_PORTAL_MERIDIAN_PASSWORD', name: 'Trish' },
      { slug: 'pinnacle', passwordEnv: 'RF_PORTAL_PINNACLE_PASSWORD', name: 'Deepa' },
    ],
  },
};

function isKnownOrg(slug) {
  return Object.prototype.hasOwnProperty.call(PORTAL_LOGINS, slug);
}

function orgLogins(slug) {
  return PORTAL_LOGINS[slug] || { staff: [], partners: [] };
}

function staffLogins(slug) {
  return orgLogins(slug).staff || [];
}

function partnerLogins(slug) {
  return orgLogins(slug).partners || [];
}

// True when at least one password for this org is actually set in the
// environment. Without it the portal would reject every correct password
// with "incorrect", which reads like a bug rather than a missing config.
function anyPasswordConfigured(slug) {
  if (process.env[OWNER_PASSWORD_ENV]) return true;
  const all = staffLogins(slug).concat(partnerLogins(slug));
  return all.some((l) => Boolean(process.env[l.passwordEnv]));
}

module.exports = {
  PORTAL_ROLE_OWNER,
  PORTAL_ROLE_STAFF,
  PORTAL_ROLE_PARTNER,
  OWNER_PASSWORD_ENV,
  PORTAL_LOGINS,
  isKnownOrg,
  orgLogins,
  staffLogins,
  partnerLogins,
  anyPasswordConfigured,
};
