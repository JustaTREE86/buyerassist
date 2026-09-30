// POST /api/eve/logout — clears the Eve session cookie. POST (not GET) so a
// stray prefetch or cross-site request can't sign the owner out.
const { clearSessionCookie } = require('../_eve');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
