// POST /api/dealer/login — exchanges a password for a signed session cookie.
//
// Two roles share one form. The password decides which:
//   BUYER_ASSIST_STAFF_PASSWORD -> staff  (read/write)
//   <DEALER>_DEALER_PASSWORD    -> dealer (read-only, pinned to that dealer)
//
// Passwords exist only as env vars on the server. They are never sent to the
// browser and never stored in the database — the browser only ever posts one
// here and receives an HttpOnly cookie back.
const { setSessionCookie, timingSafeEqualStr, ROLE_STAFF, ROLE_DEALER } = require('../_session');
const { clean } = require('../_deals');
const { getDealerBySlug } = require('../_supabase');

// Adding a dealer later = add a row here, set the env var, insert the dealer
// row, and add a route for its page. Nothing else needs to change.
const DEALER_PASSWORD_ENV = {
  'ko-cars': 'KO_CARS_DEALER_PASSWORD',
};

// Small in-memory throttle to blunt password guessing. Serverless instances
// are ephemeral and there can be several at once, so this is a speed bump,
// not a guarantee — the real protection is a long, random password.
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

// Checks the supplied password against every configured password without
// short-circuiting, so response timing can't reveal which role was matched.
function resolveRole(password, slug) {
  const staffPassword = process.env.BUYER_ASSIST_STAFF_PASSWORD;
  const dealerPassword = process.env[DEALER_PASSWORD_ENV[slug]];

  const staffHit = Boolean(staffPassword) && timingSafeEqualStr(password, staffPassword);
  const dealerHit = Boolean(dealerPassword) && timingSafeEqualStr(password, dealerPassword);

  if (staffHit) return ROLE_STAFF;
  if (dealerHit) return ROLE_DEALER;
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const body = req.body || {};
  const slug = clean(body.dealer, 60).toLowerCase();
  const name = clean(body.name, 80);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!Object.prototype.hasOwnProperty.call(DEALER_PASSWORD_ENV, slug)) {
    return res.status(404).json({ ok: false, error: 'Unknown dealer.' });
  }
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Please enter your name.' });
  }
  if (!password) {
    return res.status(400).json({ ok: false, error: 'Please enter the password.' });
  }

  if (!process.env.BUYER_ASSIST_STAFF_PASSWORD && !process.env[DEALER_PASSWORD_ENV[slug]]) {
    console.error('dealer/login: no passwords configured for ' + slug);
    return res.status(500).json({ ok: false, error: 'Dealer login is not configured yet.' });
  }

  if (tooManyAttempts(clientIp(req))) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' });
  }

  let role;
  try {
    role = resolveRole(password, slug);
  } catch (err) {
    console.error('dealer/login: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Could not sign you in right now.' });
  }

  // One message for every failure — never reveal whether the password was
  // close, or which role it nearly matched.
  if (!role) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  try {
    const dealer = await getDealerBySlug(slug);
    if (!dealer) {
      console.error('dealer/login: no dealer row for slug ' + slug);
      return res.status(500).json({ ok: false, error: 'Dealer record is missing. Contact Buyer Assist.' });
    }
    setSessionCookie(res, { role, dealerSlug: slug, name });
    return res.status(200).json({
      ok: true,
      session: { role, name, dealerSlug: slug, dealerName: dealer.name },
    });
  } catch (err) {
    console.error('dealer/login: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Could not sign you in right now.' });
  }
};
