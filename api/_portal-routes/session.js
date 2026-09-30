// GET /api/portal/session — who am I, and what does this board look like?
//
// Called on every page load. Answers three things the browser cannot know
// on its own and must never keep its own copy of:
//
//   1. whether there is still a valid session (the cookie is HttpOnly)
//   2. the org's branding and stage list, so the UI never drifts from the
//      database the way a hardcoded copy would
//   3. the referral partner list — owner and staff only
//
// Point 3 is deliberate. Who a broker's referral partners are is
// commercially sensitive, so that list is never served to an unauthenticated
// request and never to a partner, who would otherwise learn the names of
// every other firm the broker deals with.
const { readPortalSession } = require('../_portal-session');
const { clean, getOrgBySlug, listPartnersForOrg, getPartnerBySlug } = require('../_portal-db');
const { PORTAL_ROLE_PARTNER, isKnownOrg } = require('../_portal-config');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // The slug in the query is only ever used for the signed-out response, so
  // the login screen can show the right logo before anyone has a session.
  // Once signed in, the org always comes from the cookie.
  const askedFor = clean((req.query && req.query.org) || '', 60).toLowerCase();

  let session = null;
  try {
    session = readPortalSession(req);
  } catch (err) {
    // A missing or too-short DEALER_SESSION_SECRET. Say so plainly rather
    // than looking like a wrong password forever.
    console.error('portal/session: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Sessions are not configured on the server.' });
  }

  try {
    // Signed out. Serve just enough to brand the login screen — name, logo
    // and colour. No stage list, no partners, no deals.
    if (!session) {
      if (!askedFor || !isKnownOrg(askedFor)) {
        return res.status(200).json({ ok: true, authenticated: false, org: null });
      }
      const org = await getOrgBySlug(askedFor);
      if (!org) return res.status(200).json({ ok: true, authenticated: false, org: null });
      return res.status(200).json({
        ok: true,
        authenticated: false,
        org: {
          slug: org.slug,
          name: org.name,
          shortName: org.short_name,
          accent: org.accent,
          logo: org.logo_url,
          logoWhite: org.logo_white_url,
          domainLabel: org.domain_label,
        },
      });
    }

    const org = await getOrgBySlug(session.orgSlug);
    if (!org) return res.status(404).json({ ok: false, error: 'Portal not found.' });

    const isPartner = session.role === PORTAL_ROLE_PARTNER;
    const partner = isPartner ? await getPartnerBySlug(org.id, session.partnerSlug) : null;

    // Switched off mid-session. The cookie is still valid but the access is
    // not, so it dies on the next request rather than at the next re-login.
    if (isPartner && !partner) {
      return res.status(403).json({ ok: false, error: 'This access has been switched off.' });
    }

    const partners = isPartner ? [] : await listPartnersForOrg(org.id);

    return res.status(200).json({
      ok: true,
      authenticated: true,
      session: {
        role: session.role,
        name: session.name,
        orgSlug: org.slug,
        // What this session may do, decided here rather than inferred from
        // the role in the browser. canWrite drives the board; canMessage is
        // separate because a partner has neither and yet can still post a
        // note on a deal they referred (see _portal-routes/notes.js).
        canWrite: !isPartner,
        canMessage: true,
        partner: partner
          ? { slug: partner.slug, name: partner.name, kind: partner.kind, accent: partner.accent }
          : null,
      },
      org: {
        slug: org.slug,
        name: org.name,
        shortName: org.short_name,
        accent: org.accent,
        logo: org.logo_url,
        logoWhite: org.logo_white_url,
        domainLabel: org.domain_label,
        itemLabel: org.item_label,
        customerLabel: org.customer_label,
        stages: org.stages || [],
      },
      partners: partners.map((p) => ({
        slug: p.slug, name: p.name, kind: p.kind, accent: p.accent, id: p.id,
      })),
    });
  } catch (err) {
    console.error('portal/session: ' + err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please refresh and try again.' });
  }
};
