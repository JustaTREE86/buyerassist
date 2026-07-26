// /api/dealer/deals — the dashboard's data endpoint.
//
//   GET   list the signed-in dealer's deals (staff and dealer users)
//   POST  create a deal            (staff only)
//   PATCH edit / restage / archive (staff only)
//
// Security notes:
//  - The dealer scope always comes from the signed session cookie, never from
//    the request. A caller cannot ask for another dealer's deals by passing a
//    different id, so there is no endpoint here that returns "all deals".
//  - Salesperson scope works the same way: a login tied to one salesperson
//    (see _dealer-config.js) carries that name in the signed session, and
//    listDealsForDealer filters on it server-side. There is no request
//    parameter that can widen it back out.
//  - Writes go through requireStaff, so a dealer session is read-only on the
//    server. Hiding the buttons in the UI is only cosmetic.
const { requireSession, requireStaff } = require('../_session');
const { validateDealInput, clean } = require('../_deals');
const {
  getDealerBySlug,
  listDealsForDealer,
  getDealForDealer,
  insertDeal,
  updateDealForDealer,
  insertNote,
} = require('../_supabase');

async function handleGet(req, res, session, dealer) {
  const archived = String((req.query && req.query.archived) || 'false') === 'true';
  // A scoped dealer login (session.salesperson set) only ever gets its own
  // deals back — staff and any non-scoped session get the dealer's full list.
  const deals = await listDealsForDealer(dealer.id, { archived, salesperson: session.salesperson || null });
  return res.status(200).json({
    ok: true,
    deals,
    dealer: { name: dealer.name, slug: dealer.slug },
    fetchedAt: new Date().toISOString(),
  });
}

async function handlePost(req, res, session, dealer) {
  const { errors, record } = validateDealInput(req.body || {});
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  const initialNote = clean((req.body || {}).initial_note, 4000);

  const deal = await insertDeal({
    ...record,
    dealer_id: dealer.id,
    created_by: session.name,
    updated_by: session.name,
  });
  if (!deal) return res.status(500).json({ ok: false, error: 'The deal could not be saved.' });

  // Opening entry in the history, so every deal has a starting point even if
  // staff didn't type a note.
  const opening = initialNote || `Deal created at stage "${record.status}".`;
  await insertNote(deal.id, opening, session.name);

  return res.status(201).json({ ok: true, deal });
}

async function handlePatch(req, res, session, dealer) {
  const body = req.body || {};
  const id = clean(body.id, 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing deal id.' });

  // Confirms the deal belongs to this dealer before touching it. A deal under
  // another dealer reads as "not found" — the caller can't tell it exists.
  const existing = await getDealForDealer(id, dealer.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Deal not found.' });

  const patch = { updated_by: session.name };

  // Archive / restore on its own, without touching the rest of the record.
  if (typeof body.archived === 'boolean') {
    patch.archived = body.archived;
  }

  // Distinguishes a full edit from the dashboard's stage-only dropdown. These
  // three are sent by the edit form and nothing else, so `status` must NOT be
  // one of them — a stage-only change sends status alone, and treating that as
  // a full edit would fail validation for the customer/vehicle fields it never
  // sent.
  const editingFields = ['customer_name', 'vehicle_make', 'vehicle_model']
    .some(k => Object.prototype.hasOwnProperty.call(body, k));

  let statusChange = null;

  if (editingFields) {
    const { errors, record } = validateDealInput(body);
    if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });
    Object.assign(patch, record);
    if (record.status && record.status !== existing.status) {
      statusChange = { from: existing.status, to: record.status };
    }
  } else if (typeof body.status === 'string' && body.status) {
    // Stage-only change from the dashboard dropdown.
    const { errors, record } = validateDealInput({ status: body.status }, { partial: true });
    if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });
    if (record.status !== existing.status) {
      patch.status = record.status;
      statusChange = { from: existing.status, to: record.status };
    }
  }

  const deal = await updateDealForDealer(id, dealer.id, patch);
  if (!deal) return res.status(404).json({ ok: false, error: 'Deal not found.' });

  // Stage moves and archiving are logged to the history automatically, so the
  // activity trail explains itself without staff having to write it out.
  if (statusChange) {
    await insertNote(id, `Stage changed from "${statusChange.from}" to "${statusChange.to}".`, session.name);
  }
  if (typeof body.archived === 'boolean' && body.archived !== existing.archived) {
    await insertNote(id, body.archived ? 'Deal archived.' : 'Deal restored to the active list.', session.name);
  }

  return res.status(200).json({ ok: true, deal });
}

module.exports = async function handler(req, res) {
  // Customer PII — never let a CDN or browser cache hold a copy.
  res.setHeader('Cache-Control', 'private, no-store');

  const method = req.method;
  const isWrite = method === 'POST' || method === 'PATCH';

  if (method !== 'GET' && !isWrite) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const session = isWrite ? requireStaff(req, res) : requireSession(req, res);
  if (!session) return; // guard already sent 401/403

  try {
    const dealer = await getDealerBySlug(session.dealerSlug);
    if (!dealer) return res.status(404).json({ ok: false, error: 'Dealer not found.' });

    if (method === 'GET') return await handleGet(req, res, session, dealer);
    if (method === 'POST') return await handlePost(req, res, session, dealer);
    return await handlePatch(req, res, session, dealer);
  } catch (err) {
    // Log the detail server-side; return something generic so database shape
    // and constraint names never reach the browser.
    console.error('dealer/deals: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
