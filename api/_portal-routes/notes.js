// POST /api/portal?action=notes — adds an entry to a deal's history.
//
// Both directions. Org staff post updates; the referring firm posts back on
// the deals they sent. That second half is the point of the product: the
// referrer asking "any news on the valuation?" in the same place they read
// the answer is what replaces the phone call.
//
// WHAT A PARTNER CAN AND CANNOT DO HERE
// -------------------------------------
//   can     write a note on a deal they referred
//   cannot  write on any other deal — those read as "not found", the same as
//           a deal under another brokerage, so the response cannot be used to
//           discover that a deal exists
//   cannot  write an internal note. visibility is forced to 'all' rather than
//           taken from the body, and the trigger added in the second
//           migration refuses the combination at the database as well.
//
// A partner's own message is attributed to their firm as well as to them, so
// the brokerage's board shows who it came from without having to work it out
// from the name.
//
// Notes are insert-only everywhere: there is no edit and no delete, here or
// in the data layer. A history that can be rewritten is not a history.
const { requirePortal } = require('../_portal-session');
const { PORTAL_ROLE_PARTNER } = require('../_portal-config');
const {
  clean,
  getOrgBySlug,
  getDealForOrg,
  getPartnerBySlug,
  insertNote,
  updateDealForOrg,
  validateNote,
} = require('../_portal-db');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // Not requirePortalWriter. A partner is still read-only on deals — no
  // stage changes, no edits, no archiving — but their own messages are a
  // write they are allowed to make, and the scoping below is what bounds it.
  const session = requirePortal(req, res);
  if (!session) return; // guard already sent 401

  const body = req.body || {};
  const dealId = clean(body.deal_id, 64);
  if (!dealId) return res.status(400).json({ ok: false, error: 'Missing deal id.' });

  const { errors, note } = validateNote(body.note);
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  const isPartner = session.role === PORTAL_ROLE_PARTNER;

  try {
    const org = await getOrgBySlug(session.orgSlug);
    if (!org) return res.status(404).json({ ok: false, error: 'Portal not found.' });

    // A deal under another org reads as "not found", so a note cannot be
    // written onto a board this session does not belong to.
    const deal = await getDealForOrg(dealId, org.id);
    if (!deal) return res.status(404).json({ ok: false, error: 'Deal not found.' });

    let author = session.name;
    let visibility = body.visibility === 'internal' ? 'internal' : 'all';
    let authorRole = 'staff';

    if (isPartner) {
      const partner = await getPartnerBySlug(org.id, session.partnerSlug);
      if (!partner) return res.status(403).json({ ok: false, error: 'This access has been switched off.' });

      // The same check the board query makes, applied to a single row. A deal
      // this firm did not refer is not theirs to write on, and it answers
      // "not found" rather than "forbidden" so the reply cannot be used to
      // confirm a deal id exists.
      if (deal.partner_id !== partner.id) {
        return res.status(404).json({ ok: false, error: 'Deal not found.' });
      }

      visibility = 'all';
      authorRole = 'partner';
      // Signed with the person and the firm, unless the firm has no named
      // contact, in which case the firm name is all there is.
      author = (session.name && session.name !== partner.name)
        ? `${session.name}, ${partner.name}`
        : partner.name;
    }

    const saved = await insertNote(dealId, note, author, visibility, authorRole);
    if (!saved) return res.status(500).json({ ok: false, error: 'The note could not be saved.' });

    // Bump the deal so the board reorders. The board is sorted newest-touched
    // first, and a note is the most common way a deal moves — without this a
    // deal someone just wrote on would sit where it was. Writing updated_by
    // fires the updated_at trigger; there is no separate "touch" call, and it
    // also means the brokerage's board shows a partner's name against a deal
    // the moment they ask something.
    const touched = await updateDealForOrg(dealId, org.id, { updated_by: author });

    return res.status(201).json({ ok: true, note: saved, deal: touched || null });
  } catch (err) {
    console.error('portal/notes: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
