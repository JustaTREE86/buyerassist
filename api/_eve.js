// Domain + session layer for the hidden Eve commission tracker (/eve).
//
// Single-owner by design: one password (EVE_PASSWORD), one signed cookie, no
// dealer/salesperson scoping. Kept separate from _session.js/_dealer-config.js
// so nothing about Eve's private numbers rides on the dealer dashboard's auth,
// and a dealer session cookie can never unlock this page (different cookie
// name below, checked by its own verify).
//
// No npm deps — plain Node.js on Vercel, same constraint as the rest of /api.
const crypto = require('crypto');
const { sbRequest, enc, isConfigured } = require('./_supabase');
const { timingSafeEqualStr } = require('./_util');

// ---------------------------------------------------------------------------
// Session (signed HttpOnly cookie, mirrors api/_session.js but standalone)
// ---------------------------------------------------------------------------
const COOKIE_NAME = 'ba_eve_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours, then re-login.

// Reuses DEALER_SESSION_SECRET as the HMAC key so there is one secret to
// rotate. Isolation between the two areas comes from the distinct cookie NAME,
// not the key: /api/eve/* only ever reads ba_eve_session and /api/dealer/*
// only reads ba_dealer_session, so neither cookie is valid for the other.
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

function signSession() {
  const payload = { scope: 'eve', exp: Date.now() + SESSION_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

function verifySessionToken(token) {
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
  if (!payload || payload.scope !== 'eve') return null;
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
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

function cookieHeader(value, maxAgeSeconds) {
  return [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

function setSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader(signSession(), Math.floor(SESSION_TTL_MS / 1000)));
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}
function readSession(req) {
  return verifySessionToken(parseCookies(req)[COOKIE_NAME]);
}

// Returns the session, or null after having already sent a 401/500 — so a
// handler can `const s = requireSession(req, res); if (!s) return;`.
function requireSession(req, res) {
  let session = null;
  try {
    session = readSession(req);
  } catch (err) {
    console.error('eve session: ' + err.message);
    res.status(500).json({ ok: false, error: 'Sessions are not configured on the server.' });
    return null;
  }
  if (!session) {
    res.status(401).json({ ok: false, error: 'Please sign in again.' });
    return null;
  }
  return session;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
// Default split for a new deal when none is supplied. Set EVE_CUT_PERCENT in
// Vercel to change it going forward; existing rows keep the percent they were
// saved with.
function defaultCutPercent() {
  const n = Number(process.env.EVE_CUT_PERCENT);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 50;
}

const MAX = { deal_name: 160, note: 4000, entry_time: 40 };

// Replace ASCII control chars (code < 32, plus 127) with a space, then trim
// and cap. Done by code point so there are no literal control bytes in this
// source file. Values are parameterised by PostgREST and escaped by React on
// render, so this is about clean data, not escaping for a sink.
function clean(value, max) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out += (c < 32 || c === 127) ? ' ' : s[i];
  }
  return out.trim().slice(0, max);
}

function money(value, errors, label) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    errors.push(`Enter a valid ${label} (0 or more).`);
    return null;
  }
  return Math.round(n * 100) / 100;
}

// Returns { errors, record }. `partial` skips required-field checks so a PATCH
// can touch a subset (e.g. just the paid toggle) without resending everything.
function validateCommissionInput(input, { partial = false } = {}) {
  const errors = [];
  const body = input && typeof input === 'object' ? input : {};
  const record = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('category')) {
    // 'deal' = normal Buyer Assist commission; 'extra' = off-book extra
    // curricular split. Anything else falls back to 'deal'.
    record.category = body.category === 'extra' ? 'extra' : 'deal';
  }

  if (!partial || has('deal_name')) {
    const deal_name = clean(body.deal_name, MAX.deal_name);
    if (!deal_name) errors.push('Enter a client or deal name.');
    record.deal_name = deal_name;
  }

  if (!partial || has('commission')) {
    const commission = money(body.commission, errors, 'commission amount');
    record.commission = commission === null ? 0 : commission;
  }

  if (!partial || has('outgoings')) {
    const outgoings = money(body.outgoings, errors, 'outgoings amount');
    record.outgoings = outgoings === null ? 0 : outgoings;
  }

  if (!partial || has('cut_percent')) {
    if (body.cut_percent === '' || body.cut_percent === null || body.cut_percent === undefined) {
      record.cut_percent = defaultCutPercent();
    } else {
      const n = Number(body.cut_percent);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        errors.push('Enter a cut percent between 0 and 100.');
      } else {
        record.cut_percent = Math.round(n * 100) / 100;
      }
    }
  }

  if (!partial || has('deal_date')) {
    const d = clean(body.deal_date, 10);
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      errors.push('Enter the deal date as YYYY-MM-DD.');
    }
    record.deal_date = d || null;
  }

  if (!partial || has('entry_time')) {
    const t = clean(body.entry_time, MAX.entry_time);
    record.entry_time = t || null;
  }

  if (!partial || has('paid')) {
    record.paid = body.paid === true || body.paid === 'true';
  }

  if (!partial || has('note')) {
    const note = clean(body.note, MAX.note);
    record.note = note || null;
  }

  return { errors, record };
}

// ---------------------------------------------------------------------------
// Data access (single-owner: no scoping column, service_role only)
// ---------------------------------------------------------------------------
const COLUMNS = [
  'id', 'category', 'deal_name', 'deal_date', 'entry_time', 'commission', 'outgoings',
  'cut_percent', 'paid', 'note', 'created_at', 'updated_at',
].join(',');

async function listCommissions() {
  const path = `eve_commissions?select=${enc(COLUMNS)}&order=deal_date.desc.nullslast,created_at.desc`;
  return (await sbRequest(path)) || [];
}

async function insertCommission(record) {
  const rows = await sbRequest(`eve_commissions?select=${enc(COLUMNS)}`, {
    method: 'POST',
    body: record,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

async function updateCommission(id, patch) {
  const path = `eve_commissions?id=eq.${enc(id)}&select=${enc(COLUMNS)}`;
  const rows = await sbRequest(path, {
    method: 'PATCH',
    body: { ...patch, updated_at: new Date().toISOString() },
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

async function deleteCommission(id) {
  const path = `eve_commissions?id=eq.${enc(id)}&select=id`;
  const rows = await sbRequest(path, { method: 'DELETE', prefer: 'return=representation' });
  return (rows && rows[0]) || null;
}

module.exports = {
  // session
  setSessionCookie,
  clearSessionCookie,
  readSession,
  requireSession,
  // config
  defaultCutPercent,
  isConfigured,
  // domain
  validateCommissionInput,
  clean,
  // data
  listCommissions,
  insertCommission,
  updateCommission,
  deleteCommission,
};
