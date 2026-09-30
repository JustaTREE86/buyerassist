// POST /api/portal/logout — clears the portal session cookie.
//
// Always returns 200, even without a session. Signing out is not something a
// caller should be told they failed at, and the outcome is identical either
// way: no valid cookie.
const { clearPortalCookie } = require('../_portal-session');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  clearPortalCookie(res);
  return res.status(200).json({ ok: true });
};
