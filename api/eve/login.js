// POST /api/eve/login — exchanges the Eve-tracker password for a signed,
// HttpOnly session cookie. The password lives only in EVE_PASSWORD on the
// server; it is never in the frontend bundle and never stored in the database.
const { setSessionCookie } = require('../_eve');
const { timingSafeEqualStr } = require('../_util');

// In-memory speed bump against guessing. Serverless instances are ephemeral,
// so this is not a guarantee — a long random password is the real protection.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { first: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : String(fwd || '')).split(',')[0].trim() || 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  res.setHeader('Cache-Control', 'private, no-store');

  const expected = process.env.EVE_PASSWORD;
  if (!expected) {
    console.error('eve/login: EVE_PASSWORD is not configured');
    return res.status(500).json({ ok: false, error: 'This page is not configured yet.' });
  }

  if (tooManyAttempts(clientIp(req))) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' });
  }

  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!password || !timingSafeEqualStr(password, expected)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  try {
    setSessionCookie(res);
  } catch (err) {
    console.error('eve/login: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Could not sign you in right now.' });
  }
  return res.status(200).json({ ok: true });
};
