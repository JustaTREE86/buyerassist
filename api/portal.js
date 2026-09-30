// /api/portal?action=… — the whole Referral Partner Portal API, in one
// serverless function.
//
// WHY ONE FILE INSTEAD OF FIVE
// ----------------------------
// Vercel's Hobby plan allows 12 Serverless Functions per deployment and this
// project was already at exactly 12. Five more (login, logout, session,
// deals, notes) made 17 and the deploy was rejected outright:
//
//   "No more than 12 Serverless Functions can be added to a Deployment on
//    the Hobby plan."
//
// Anything under /api that does NOT start with an underscore becomes a
// function, so the five handlers live in api/_portal-routes/ — real modules,
// skipped by the build — and this dispatcher is the only function. The
// handlers themselves are untouched: each is still a plain
// (req, res) => … module, testable on its own, and moving one back out to
// its own route later is a one-line change here.
//
// The client calls /api/portal?action=deals rather than /api/portal/deals.
// A rewrite could have preserved the prettier path, but Vercel's legacy
// `routes` merge query strings in a way that is easy to get subtly wrong
// (?archived=true has to survive), and an internal API is not worth that
// risk. See page-portal.jsx, which builds every URL through portalUrl().
const ROUTES = {
  login: require('./_portal-routes/login'),
  logout: require('./_portal-routes/logout'),
  session: require('./_portal-routes/session'),
  deals: require('./_portal-routes/deals'),
  notes: require('./_portal-routes/notes'),
  partners: require('./_portal-routes/partners'),
};

module.exports = async function handler(req, res) {
  // Customer PII passes through here. Each handler sets this too; setting it
  // before dispatch means an unknown action can never be cached either.
  res.setHeader('Cache-Control', 'private, no-store');

  const raw = (req.query && req.query.action) || '';
  const action = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();

  const route = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : null;
  if (!route) {
    return res.status(404).json({ ok: false, error: 'Unknown action.' });
  }

  return route(req, res);
};
