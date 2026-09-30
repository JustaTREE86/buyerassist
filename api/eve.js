// /api/eve?action=… — the Eve commission tracker API, in one serverless
// function.
//
// Collapsed from three functions (login, logout, commissions) for the same
// reason as api/portal.js: Vercel's Hobby plan allows 12 Serverless Functions
// per deployment, and adding the portal took the project over. See the header
// of api/portal.js for the full note.
//
// The three handlers moved to api/_eve-routes/ unchanged — same code, same
// requires, same behaviour. Only the URL the browser calls changed, in
// page-eve.jsx.
const ROUTES = {
  login: require('./_eve-routes/login'),
  logout: require('./_eve-routes/logout'),
  commissions: require('./_eve-routes/commissions'),
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  const raw = (req.query && req.query.action) || '';
  const action = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();

  const route = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : null;
  if (!route) {
    return res.status(404).json({ ok: false, error: 'Unknown action.' });
  }

  return route(req, res);
};
