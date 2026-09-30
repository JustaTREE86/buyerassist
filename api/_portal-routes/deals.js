// /api/portal/deals — the portal's data endpoint.
//
//   GET   list the board                      (every role)
//   POST  create a deal                       (owner + org staff)
//   PATCH edit / restage / archive            (owner + org staff)
//
// Security notes:
//  - The org scope always comes from the signed session cookie, never from
//    the request. There is no endpoint here that returns "all orgs".
//  - A partner session is scoped again by its own partner_id, set from the
//    password at sign-in. GET for a partner runs a different query, not the
//    same query with rows hidden afterwards.
//  - Writes go through requirePortalWriter, so a partner session is read-only
//    on the server. Hiding the controls in the UI is only cosmetic.
//  - Internal notes are dropped from partner responses by the query itself,
//    so they are not in the payload to be found.
const { requirePortal, requirePortalWriter } = require('../_portal-session');
const { PORTAL_ROLE_PARTNER } = require('../_portal-config');
const {
  clean,
  getOrgBySlug,
  getPartnerBySlug,
  listDealsForOrg,
  listDealsForPartner,
  getDealForOrg,
  insertDeal,
  updateDealForOrg,
  insertNote,
  validateDealInput,
} = require('../_portal-db');

// Resolves the referral partner a write refers to. The browser sends a slug;
// the id it maps to is looked up under THIS org, so a slug from another firm
// resolves to nothing rather than to their partner.
async function resolvePartnerId(body, org) {
  const slug = clean(body.partner || '', 60).toLowerCase();
  if (!slug) return { partnerId: null };
  const partner = await getPartnerBySlug(org.id, slug);
  if (!partner) return { error: 'That referral partner is not on this portal.' };
  return { partnerId: partner.id };
}

async function handleGet(req, res, session, org) {
  const archived = String((req.query && req.query.archived) || 'false') === 'true';

  let deals;
  if (session.role === PORTAL_ROLE_PARTNER) {
    const partner = await getPartnerBySlug(org.id, session.partnerSlug);
    if (!partner) return res.status(403).json({ ok: false, error: 'This access has been switched off.' });
    deals = await listDealsForPartner(org.id, partner.id, { archived });
  } else {
    deals = await listDealsForOrg(org.id, { archived });
  }

  return res.status(200).json({
    ok: true,
    deals,
    org: { name: org.name, slug: org.slug },
    fetchedAt: new Date().toISOString(),
  });
}

async function handlePost(req, res, session, org) {
  const body = req.body || {};
  const { errors, record } = validateDealInput(body, org);
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  const resolved = await resolvePartnerId(body, org);
  if (resolved.error) return res.status(400).json({ ok: false, error: resolved.error });

  const deal = await insertDeal({
    ...record,
    partner_id: resolved.partnerId,
    org_id: org.id,
    created_by: session.name,
    updated_by: session.name,
  });
  if (!deal) return res.status(500).json({ ok: false, error: 'The deal could not be saved.' });

  // Opening entry in the history, so every deal has a starting point even if
  // nobody typed a note.
  const initialNote = clean(body.initial_note, 4000);
  const opening = initialNote || `Added to the board at stage "${record.status}".`;
  await insertNote(deal.id, opening, session.name, 'all');

  return res.status(201).json({ ok: true, deal });
}

async function handlePatch(req, res, session, org) {
  const body = req.body || {};
  const id = clean(body.id, 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing deal id.' });

  // Confirms the deal belongs to this org before touching it. A deal under
  // another org reads as "not found" — the caller cannot tell it exists.
  const existing = await getDealForOrg(id, org.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Deal not found.' });

  const patch = { updated_by: session.name };

  if (typeof body.archived === 'boolean') {
    patch.archived = body.archived;
  }

  // Distinguishes a full edit from the board's stage-only dropdown. `status`
  // is deliberately not in this list: a stage change sends status alone, and
  // treating that as a full edit would fail validation for the subject and
  // applicant fields it never sent.
  const editingFields = ['subject', 'customer_name', 'customer_mobile', 'customer_email', 'subject_details', 'partner']
    .some((k) => Object.prototype.hasOwnProperty.call(body, k));

  let statusChange = null;

  if (editingFields) {
    const { errors, record } = validateDealInput(body, org);
    if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

    const resolved = await resolvePartnerId(body, org);
    if (resolved.error) return res.status(400).json({ ok: false, error: resolved.error });

    Object.assign(patch, record, { partner_id: resolved.partnerId });
    if (record.status && record.status !== existing.status) {
      statusChange = { from: existing.status, to: record.status };
    }
  } else if (typeof body.status === 'string' && body.status) {
    const { errors, record } = validateDealInput({ status: body.status }, org, { partial: true });
    if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });
    if (record.status !== existing.status) {
      patch.status = record.status;
      statusChange = { from: existing.status, to: record.status };
    }
  }

  const deal = await updateDealForOrg(id, org.id, patch);
  if (!deal) return res.status(404).json({ ok: false, error: 'Deal not found.' });

  // Stage moves and archiving write their own history entry, so the trail
  // explains itself without anyone having to type it out. Visible to the
  // partner: a stage change is exactly what they signed in to see.
  if (statusChange) {
    await insertNote(id, `Stage changed from "${statusChange.from}" to "${statusChange.to}".`, session.name, 'all');
  }
  if (typeof body.archived === 'boolean' && body.archived !== existing.archived) {
    await insertNote(
      id,
      body.archived ? 'Removed from the active board.' : 'Restored to the active board.',
      session.name,
      'internal',
    );
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

  const session = isWrite ? requirePortalWriter(req, res) : requirePortal(req, res);
  if (!session) return; // guard already sent 401/403

  try {
    const org = await getOrgBySlug(session.orgSlug);
    if (!org) return res.status(404).json({ ok: false, error: 'Portal not found.' });

    if (method === 'GET') return await handleGet(req, res, session, org);
    if (method === 'POST') return await handlePost(req, res, session, org);
    return await handlePatch(req, res, session, org);
  } catch (err) {
    // Log the detail server-side; return something generic so database shape
    // and constraint names never reach the browser.
    console.error('portal/deals: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
