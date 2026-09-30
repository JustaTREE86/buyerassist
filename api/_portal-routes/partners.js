// /api/portal?action=partners — the brokerage manages its own referral firms.
//
//   GET     list every partner, active or not, with a deal count
//   POST    add a firm and mint its first access code
//   PATCH   rename / recolour / switch off / issue a new code
//   DELETE  remove a firm outright, only when nothing is attributed to it
//
// Owner and org staff only. Every method goes through requirePortalWriter,
// which refuses a partner session outright: the list of firms a broker deals
// with is the most commercially sensitive thing on this board, and a referral
// firm learning who else refers is worse than them reading a deal.
//
// The org is always taken from the signed cookie. There is no parameter here
// that names an org, so there is no version of this endpoint that touches
// another brokerage's partner list.
//
// ACCESS CODES
// ------------
// The plaintext code exists for exactly one response. It is generated in
// _portal-db.js, hashed on the way into the table, and returned to the caller
// once. It is never logged, never re-readable, and a lost one is replaced
// rather than recovered — which is also the revoke path, since issuing a new
// code invalidates the old one in the same write.
const { requirePortalWriter } = require('../_portal-session');
const { formatAccessCode } = require('../_portal-codes');
const {
  clean,
  getOrgBySlug,
  listPartnersAdmin,
  getPartnerById,
  insertPartner,
  updatePartnerForOrg,
  regeneratePartnerCode,
  deletePartnerForOrg,
  validatePartnerInput,
} = require('../_portal-db');

// Shape sent to the browser. Written out field by field rather than spreading
// the row, so a column added to portal_partners later cannot arrive here on
// its own — access_code_hash most of all.
function toClient(partner) {
  return {
    id: partner.id,
    slug: partner.slug,
    name: partner.name,
    kind: partner.kind,
    accent: partner.accent,
    active: partner.active,
    contactName: partner.contact_name,
    contactEmail: partner.contact_email,
    hasCode: Boolean(partner.code_set_at),
    codeSetAt: partner.code_set_at,
    dealCount: typeof partner.deal_count === 'number' ? partner.deal_count : 0,
    createdAt: partner.created_at,
    createdBy: partner.created_by,
  };
}

async function handleGet(req, res, session, org) {
  const partners = await listPartnersAdmin(org.id);
  return res.status(200).json({ ok: true, partners: partners.map(toClient) });
}

async function handlePost(req, res, session, org) {
  const { errors, record } = validatePartnerInput(req.body || {});
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  // Used only to pick the next fallback colour, so two firms added back to
  // back never come out the same shade.
  const existing = await listPartnersAdmin(org.id);

  const created = await insertPartner(org.id, record, session.name, existing.length);
  if (!created) return res.status(500).json({ ok: false, error: 'That partner could not be saved.' });

  // The one and only time the code is readable.
  return res.status(201).json({
    ok: true,
    partner: toClient(created.partner),
    code: formatAccessCode(created.code),
  });
}

async function handlePatch(req, res, session, org) {
  const body = req.body || {};
  const id = clean(body.id, 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing partner id.' });

  // Confirms the firm belongs to this org before touching it. One under
  // another brokerage reads as "not found".
  const existing = await getPartnerById(org.id, id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Partner not found.' });

  // Issuing a new code is its own action, not a field edit, and it is the
  // only branch that returns a code.
  if (body.regenerate === true) {
    const result = await regeneratePartnerCode(org.id, id);
    if (!result) return res.status(500).json({ ok: false, error: 'A new code could not be issued.' });
    return res.status(200).json({
      ok: true,
      partner: toClient({ ...result.partner, deal_count: existing.deal_count }),
      code: formatAccessCode(result.code),
    });
  }

  const { errors, record } = validatePartnerInput(body, { partial: true });
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  const patch = { ...record };

  // Switching a firm off kills their sign-in on the next request and keeps
  // every deal they referred exactly where it is.
  if (typeof body.active === 'boolean') patch.active = body.active;

  if (!Object.keys(patch).length) {
    return res.status(400).json({ ok: false, error: 'Nothing to change.' });
  }

  const partner = await updatePartnerForOrg(org.id, id, patch);
  if (!partner) return res.status(404).json({ ok: false, error: 'Partner not found.' });

  return res.status(200).json({
    ok: true,
    partner: toClient({ ...partner, deal_count: existing.deal_count }),
  });
}

async function handleDelete(req, res, session, org) {
  // Query first: a DELETE body is not reliably parsed by every runtime, and
  // this has to work the same under `vercel dev` as it does in production.
  const fromQuery = (req.query && req.query.id) || '';
  const fromBody = (req.body && req.body.id) || '';
  const id = clean(Array.isArray(fromQuery) ? fromQuery[0] : (fromQuery || fromBody), 64);
  if (!id) return res.status(400).json({ ok: false, error: 'Missing partner id.' });

  const existing = await getPartnerById(org.id, id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Partner not found.' });

  const result = await deletePartnerForOrg(org.id, id);
  if (result.error === 'has_deals') {
    // portal_deals.partner_id is ON DELETE SET NULL, so deleting a firm with
    // referrals would quietly unattribute every one of them. Refuse and point
    // at the action that keeps the history intact.
    return res.status(409).json({
      ok: false,
      error: 'This referral partner has deals on the board. Switch them off instead, which keeps their deals.',
    });
  }

  return res.status(200).json({ ok: true, removed: id });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  const method = req.method;
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // Reads as well as writes. A partner session must never see this list.
  const session = requirePortalWriter(req, res);
  if (!session) return; // guard already sent 401/403

  try {
    const org = await getOrgBySlug(session.orgSlug);
    if (!org) return res.status(404).json({ ok: false, error: 'Portal not found.' });

    if (method === 'GET') return await handleGet(req, res, session, org);
    if (method === 'POST') return await handlePost(req, res, session, org);
    if (method === 'PATCH') return await handlePatch(req, res, session, org);
    return await handleDelete(req, res, session, org);
  } catch (err) {
    // A duplicate slug is the one failure worth translating: it means two
    // firms with the same name, which uniquePartnerSlug should already have
    // handled, so it reads as a race rather than as user error.
    console.error('portal/partners: ' + err.message);
    if (err.supabaseCode === '23505') {
      return res.status(409).json({ ok: false, error: 'That referral partner is already on this board.' });
    }
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
