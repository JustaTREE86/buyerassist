// Minimal Supabase REST (PostgREST) client for the dealer deal tracker.
//
// Deliberately dependency-free: this project has no package.json and no build
// step, so every /api function must run on plain Node.js as shipped by Vercel
// (same constraint as _util.js). Node 18+ provides global fetch.
//
// This module uses the service_role key, which bypasses RLS. That key must
// never leave the server. Every table in the buyerassist-web database is
// deny-all to the anon/authenticated roles, so these functions are the only
// path to dealer data — which means each one below is responsible for scoping
// its query by dealer_id. Never expose a query that isn't dealer-scoped.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

async function sbRequest(path, { method = 'GET', body, prefer } = {}) {
  if (!isConfigured()) {
    throw new Error('Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  if (text) {
    try { json = JSON.parse(text); } catch { /* error bodies aren't always JSON */ }
  }

  if (!res.ok) {
    const detail = (json && (json.message || json.hint)) || text || res.statusText;
    const err = new Error(`Supabase ${method} ${path} failed (${res.status}): ${detail}`);
    err.status = res.status;
    err.supabaseCode = json && json.code;
    throw err;
  }
  return json;
}

const enc = encodeURIComponent;

// Columns returned to the browser. Listed explicitly rather than `*` so a
// future column (an internal flag, say) isn't leaked to dealers by accident.
const DEAL_COLUMNS = [
  'id', 'customer_name', 'customer_mobile', 'customer_email',
  'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_variant',
  'vehicle_registration', 'vehicle_stock_number', 'vehicle_price',
  'status', 'salesperson', 'archived', 'created_at', 'updated_at', 'created_by', 'updated_by',
].join(',');

const NOTE_COLUMNS = 'id,note,created_at,created_by';

async function getDealerBySlug(slug) {
  const rows = await sbRequest(`dealers?slug=eq.${enc(slug)}&select=id,name,slug&limit=1`);
  return (rows && rows[0]) || null;
}

// Lists a single dealer's deals with their full note history embedded, newest
// note first. dealerId is always applied — there is no "all deals" query.
// When salesperson is passed (a scoped dealer session), it's applied too, so
// a salesperson-scoped login can only ever get back their own deals — the
// same guarantee dealerId gives against other dealers.
async function listDealsForDealer(dealerId, { archived = false, salesperson = null } = {}) {
  const path =
    `deals?dealer_id=eq.${enc(dealerId)}` +
    `&archived=is.${archived ? 'true' : 'false'}` +
    (salesperson ? `&salesperson=eq.${enc(salesperson)}` : '') +
    `&select=${enc(DEAL_COLUMNS)},deal_notes(${enc(NOTE_COLUMNS)})` +
    `&order=updated_at.desc` +
    `&deal_notes.order=created_at.desc`;
  return (await sbRequest(path)) || [];
}

// Fetches one deal, but only if it belongs to dealerId. Returns null when the
// deal exists under a different dealer — the caller can't tell the difference,
// which is what stops cross-dealer probing by id.
async function getDealForDealer(dealId, dealerId) {
  const path =
    `deals?id=eq.${enc(dealId)}&dealer_id=eq.${enc(dealerId)}` +
    `&select=${enc(DEAL_COLUMNS)}&limit=1`;
  const rows = await sbRequest(path);
  return (rows && rows[0]) || null;
}

async function insertDeal(record) {
  const rows = await sbRequest(`deals?select=${enc(DEAL_COLUMNS)}`, {
    method: 'POST',
    body: record,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

async function updateDealForDealer(dealId, dealerId, patch) {
  const path = `deals?id=eq.${enc(dealId)}&dealer_id=eq.${enc(dealerId)}&select=${enc(DEAL_COLUMNS)}`;
  const rows = await sbRequest(path, {
    method: 'PATCH',
    body: patch,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

// Notes are insert-only. There is intentionally no update or delete helper:
// the activity history must never be rewritten.
async function insertNote(dealId, note, author) {
  const rows = await sbRequest(`deal_notes?select=${enc(NOTE_COLUMNS)}`, {
    method: 'POST',
    body: { deal_id: dealId, note, created_by: author },
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

module.exports = {
  // Low-level REST access, reused by the Eve commission tracker (api/_eve.js).
  // Callers that touch dealer data must still scope every query by dealer_id;
  // eve_commissions has no such scope because it is single-owner (Josh only).
  sbRequest,
  enc,
  isConfigured,
  getDealerBySlug,
  listDealsForDealer,
  getDealForDealer,
  insertDeal,
  updateDealForDealer,
  insertNote,
};
