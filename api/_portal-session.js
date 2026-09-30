// Server-side sessions for the Referral Partner Portal (/portal/:slug).
//
// Same construction as the dealer dashboard's sessions (_session.js): a
// signed cookie rather than a library, because this project has no build
// step and no npm deps. base64url(payload).base64url(HMAC-SHA256), HttpOnly,
// with expiry carried inside the signed payload so the server enforces it.
//
// Deliberately its own cookie, separate from ba_dealer_session, so a KO Cars
// login can never reach a portal board and vice versa. The signing secret is
// shared (DEALER_SESSION_SECRET, same as the Eve tracker), so the payload
// also carries a surface marker that is checked on the way back in — a token
// minted for one surface is rejected by the other even though the signature
// verifies.
const crypto = require('crypto');
const { timingSafeEqualStr } = require('./_session');
const {
  PORTAL_ROLE_OWNER,
  PORTAL_ROLE_STAFF,
  PORTAL_ROLE_PARTNER,
} = require('./_portal-config');

const PORTAL_COOKIE_NAME = 'ba_portal_session';
const PORTAL_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours, then re-login.
const SURFACE = 'portal';

const PORTAL_ROLES = [PORTAL_ROLE_OWNER, PORTAL_ROLE_STAFF, PORTAL_ROLE_PARTNER];

function secret() {
  const s = process.env.DEALER_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('DEALER_SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function hmac(body) {
  return b64url(crypto.createHmac('sha256', secret()).update(body).digest());
}

// partnerSlug is the whole access control story for a partner login: it is
// set from the password at sign-in, never from anything the browser sends,
// and _portal-db.js filters every query by it.
function signPortalSession({ role, orgSlug, partnerSlug, name }) {
  const payload = {
    sur: SURFACE,
    role,
    orgSlug,
    partnerSlug: partnerSlug || null,
    name,
    exp: Date.now() + PORTAL_SESSION_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

function verifyPortalToken(token) {
  if (typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!timingSafeEqualStr(mac, hmac(body))) return null;

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  if (payload.sur !== SURFACE) return null;
  if (!PORTAL_ROLES.includes(payload.role)) return null;
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  if (typeof payload.orgSlug !== 'string' || !payload.orgSlug) return null;

  // A partner session without a partner is not a partner session — it would
  // fall through to the unscoped board. Refuse it rather than guess.
  if (payload.role === PORTAL_ROLE_PARTNER) {
    if (typeof payload.partnerSlug !== 'string' || !payload.partnerSlug) return null;
  } else if (payload.partnerSlug != null) {
    return null;
  }

  return payload;
}

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  if (!header) return {};
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

// Secure is always set. Browsers treat http://localhost as a trustworthy
// origin, so this still works under `vercel dev`.
function cookieHeader(value, maxAgeSeconds) {
  return [
    `${PORTAL_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

function setPortalCookie(res, session) {
  res.setHeader(
    'Set-Cookie',
    cookieHeader(signPortalSession(session), Math.floor(PORTAL_SESSION_TTL_MS / 1000)),
  );
}

function clearPortalCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

function readPortalSession(req) {
  return verifyPortalToken(parseCookies(req)[PORTAL_COOKIE_NAME]);
}

// Guards. Each returns the session, or null after having already sent the
// response — so handlers can `const s = requirePortal(req, res); if (!s) return;`
function requirePortal(req, res) {
  let session = null;
  try {
    session = readPortalSession(req);
  } catch (err) {
    console.error('portal session: ' + err.message);
    res.status(500).json({ ok: false, error: 'Sessions are not configured on the server.' });
    return null;
  }
  if (!session) {
    res.status(401).json({ ok: false, error: 'Please sign in again.' });
    return null;
  }
  return session;
}

// Writes. Owner and org staff only — a referral partner is read-only on the
// server, so hiding the controls in the UI is only cosmetic.
function requirePortalWriter(req, res) {
  const session = requirePortal(req, res);
  if (!session) return null;
  if (session.role === PORTAL_ROLE_PARTNER) {
    res.status(403).json({ ok: false, error: 'Your account has view-only access.' });
    return null;
  }
  return session;
}

module.exports = {
  PORTAL_COOKIE_NAME,
  PORTAL_SESSION_TTL_MS,
  signPortalSession,
  verifyPortalToken,
  setPortalCookie,
  clearPortalCookie,
  readPortalSession,
  requirePortal,
  requirePortalWriter,
};
