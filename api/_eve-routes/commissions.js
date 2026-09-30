// /api/eve/commissions — the Eve tracker's data endpoint. Single-owner: every
// method below requires the Eve session cookie except GET, which also answers
// the "am I signed in?" bootstrap the page makes on load.
//
//   GET    { authenticated, cutPercent, rows? }   (rows only when signed in)
//   POST   create a commission row
//   PATCH  edit a row / toggle paid
//   DELETE remove a row   (body: { id })
//
// There is no scoping column — this data belongs to one person — so the only
// gate is the session. The service_role key (server-only, RLS-bypassing) is
// the sole path to the table; see api/_eve.js / api/_supabase.js.
const {
  readSession,
  requireSession,
  defaultCutPercent,
  isConfigured,
  validateCommissionInput,
  clean,
  listCommissions,
  insertCommission,
  updateCommission,
  deleteCommission,
} = require('../_eve');

async function handleGet(req, res) {
  const session = readSession(req); // throws only if the secret is misconfigured
  if (!session) {
    return res.status(200).json({ ok: true, authenticated: false, cutPercent: defaultCutPercent() });
  }
  if (!isConfigured()) {
    return res.status(500).json({ ok: false, error: 'The tracker database is not configured yet.' });
  }
  const rows = await listCommissions();
  return res.status(200).json({
    ok: true,
    authenticated: true,
    cutPercent: defaultCutPercent(),
    rows,
    fetchedAt: new Date().toISOString(),
  });
}

async function handlePost(req, res) {
  const { errors, record } = validateCommissionInput(req.body || {});
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });
  const row = await insertCommission(record);
  if (!row) return res.status(500).json({ ok: false, error: 'The deal could not be saved.' });
  return res.status(201).json({ ok: true, row });
}

async function handlePatch(req, res) {
  const body = req.body || {};
  const id = clean(body.id, 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing row id.' });

  const { errors, record } = validateCommissionInput(body, { partial: true });
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });
  if (Object.keys(record).length === 0) {
    return res.status(400).json({ ok: false, error: 'Nothing to update.' });
  }

  const row = await updateCommission(id, record);
  if (!row) return res.status(404).json({ ok: false, error: 'Deal not found.' });
  return res.status(200).json({ ok: true, row });
}

async function handleDelete(req, res) {
  const body = req.body || {};
  const id = clean(body.id, 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing row id.' });
  const row = await deleteCommission(id);
  if (!row) return res.status(404).json({ ok: false, error: 'Deal not found.' });
  return res.status(200).json({ ok: true, id: row.id });
}

module.exports = async function handler(req, res) {
  // Private financials — never cached by a CDN, proxy or browser.
  res.setHeader('Cache-Control', 'private, no-store');

  const method = req.method;
  const known = ['GET', 'POST', 'PATCH', 'DELETE'];
  if (!known.includes(method)) {
    res.setHeader('Allow', known.join(', '));
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    if (method === 'GET') return await handleGet(req, res);

    // Every write requires a valid session.
    const session = requireSession(req, res);
    if (!session) return;

    if (!isConfigured()) {
      return res.status(500).json({ ok: false, error: 'The tracker database is not configured yet.' });
    }

    if (method === 'POST') return await handlePost(req, res);
    if (method === 'PATCH') return await handlePatch(req, res);
    return await handleDelete(req, res);
  } catch (err) {
    // Log detail server-side; keep DB shape out of the browser response.
    console.error('eve/commissions: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
