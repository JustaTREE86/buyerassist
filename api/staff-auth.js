// POST /api/staff-auth — checks the password entered on the hidden
// /staff/debt-busters page against DEBT_BUSTERS_STAFF_PASSWORD. The
// password itself is never present in the frontend bundle; it only ever
// travels from the staff member's browser to this function.
const { timingSafeEqualStr } = require('./_util');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const expected = process.env.DEBT_BUSTERS_STAFF_PASSWORD;
  if (!expected) {
    console.error('staff-auth: DEBT_BUSTERS_STAFF_PASSWORD is not configured');
    return res.status(500).json({ ok: false, error: 'Staff login is not configured yet.' });
  }

  const password = req.body && req.body.password;
  if (typeof password !== 'string' || !password || !timingSafeEqualStr(password, expected)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  return res.status(200).json({ ok: true });
};
