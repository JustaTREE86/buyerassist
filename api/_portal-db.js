// Data access + domain rules for the Referral Partner Portal.
//
// Every function here is org-scoped, and the partner-facing ones are scoped
// again by partner_id. There is deliberately no "all deals" query: the org
// always comes from the signed session cookie, never from the request, so a
// caller cannot ask for another firm's board by passing a different id.
//
// Uses the shared low-level Supabase client (_supabase.js), which holds the
// service_role key and therefore bypasses RLS. That is why the scoping below
// is the security boundary — see the header of the migration.
const { sbRequest, enc, isConfigured } = require('./_supabase');
const { isValidAUPhone, isValidEmail } = require('./_util');
const { generateAccessCode, hashAccessCode } = require('./_portal-codes');

const ORG_COLUMNS = [
  'id', 'slug', 'name', 'short_name', 'accent', 'logo_url', 'logo_white_url',
  'domain_label', 'item_label', 'customer_label', 'stages', 'active',
].join(',');

// What a signed-in session is told about a partner firm. access_code_hash is
// absent on purpose and must stay absent: nothing outside this file has a
// reason to hold it, so it is never selected into a variable that could be
// spread into a response by accident.
const PARTNER_COLUMNS = 'id,slug,name,kind,accent,active,contact_name';

// The extra fields the brokerage sees when managing its own partner list.
// code_set_at is a timestamp, not the code — it answers "have they been
// issued one yet?" without being able to answer "what is it?".
const PARTNER_ADMIN_COLUMNS = `${PARTNER_COLUMNS},contact_email,code_set_at,created_at,created_by`;

const DEAL_COLUMNS = [
  'id', 'partner_id', 'subject', 'subject_details',
  'customer_name', 'customer_mobile', 'customer_email',
  'status', 'archived', 'created_at', 'updated_at', 'created_by', 'updated_by',
].join(',');

const NOTE_COLUMNS = 'id,note,visibility,author_role,created_at,created_by';

const MAX = {
  subject: 160,
  detail: 60,
  details: 4,
  customer_name: 120,
  customer_mobile: 30,
  customer_email: 200,
  status: 60,
  note: 4000,
  author: 80,
  partner_name: 120,
  partner_kind: 60,
  contact_name: 80,
  contact_email: 200,
};

// Fallback colours for a new partner firm, picked round-robin so two firms
// added in a row never come out the same. Drawn from the palette the demo
// boards already use, so a real board looks like the one Ben was sold.
const PARTNER_ACCENTS = ['#0E6E6E', '#2F6B4F', '#6B3A5B', '#2C4A6E', '#8A5A2B', '#3F4C8C'];

// Trim, drop control characters, cap length. Values are parameterised by
// PostgREST (never concatenated into SQL) and React escapes on render, so
// this is about keeping the data clean rather than escaping for a sink.
function clean(value, max) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
}

function optional(value, max) {
  const v = clean(value, max);
  return v === '' ? null : v;
}

// ---- orgs and partners --------------------------------------------------

async function getOrgBySlug(slug) {
  const rows = await sbRequest(
    `portal_orgs?slug=eq.${enc(slug)}&active=is.true&select=${enc(ORG_COLUMNS)}&limit=1`,
  );
  return (rows && rows[0]) || null;
}

// Active partners only. An inactive firm keeps its deals but disappears from
// the board's filters and can no longer sign in (see getPartnerBySlug).
async function listPartnersForOrg(orgId) {
  const path =
    `portal_partners?org_id=eq.${enc(orgId)}&active=is.true` +
    `&select=${enc(PARTNER_COLUMNS)}&order=name.asc`;
  return (await sbRequest(path)) || [];
}

async function getPartnerBySlug(orgId, slug) {
  const path =
    `portal_partners?org_id=eq.${enc(orgId)}&slug=eq.${enc(slug)}&active=is.true` +
    `&select=${enc(PARTNER_COLUMNS)}&limit=1`;
  const rows = await sbRequest(path);
  return (rows && rows[0]) || null;
}

// Sign-in for a referral firm: one indexed lookup on the hash, scoped to this
// org. The code is never compared in application code and never leaves the
// browser as anything but the thing the user typed.
//
// An inactive firm resolves to nothing, so switching one off makes their code
// simply stop working rather than producing a distinguishable "disabled"
// answer that confirms the code was right.
async function getPartnerByCode(orgId, code) {
  const hash = hashAccessCode(orgId, code);
  if (!hash) return null;
  const path =
    `portal_partners?org_id=eq.${enc(orgId)}&access_code_hash=eq.${enc(hash)}&active=is.true` +
    `&select=${enc(PARTNER_COLUMNS)}&limit=1`;
  const rows = await sbRequest(path);
  return (rows && rows[0]) || null;
}

// Has this firm been issued a code of its own? Answered without reading the
// hash into memory — the filter does the work in Postgres and only an id
// comes back.
//
// It decides whether the legacy environment-variable password for that slug
// still counts. Once a firm has a real code, the env var stops being a way in,
// so migrating a partner is a one-way door rather than two doors left open.
async function partnerHasCode(orgId, slug) {
  const path =
    `portal_partners?org_id=eq.${enc(orgId)}&slug=eq.${enc(slug)}` +
    `&access_code_hash=not.is.null&select=id&limit=1`;
  const rows = await sbRequest(path);
  return Boolean(rows && rows.length);
}

// ---- partner administration --------------------------------------------
//
// Owner and org staff only — enforced by requirePortalWriter in the route,
// because a partner learning the names of every other firm a broker deals
// with is the single most commercially damaging leak this product has.

// Every partner including switched-off ones, with a count of the deals
// attributed to each. The count is what decides whether a firm can be deleted
// outright or only deactivated, and it is worked out here rather than trusted
// from the browser.
async function listPartnersAdmin(orgId) {
  const partners = (await sbRequest(
    `portal_partners?org_id=eq.${enc(orgId)}&select=${enc(PARTNER_ADMIN_COLUMNS)}&order=name.asc`,
  )) || [];

  // One extra query rather than a PostgREST embedded aggregate: these boards
  // hold tens of deals, not thousands, and a plain select is the version that
  // cannot break on a PostgREST version difference.
  const rows = (await sbRequest(
    `portal_deals?org_id=eq.${enc(orgId)}&partner_id=not.is.null&select=partner_id`,
  )) || [];

  const counts = new Map();
  for (const row of rows) counts.set(row.partner_id, (counts.get(row.partner_id) || 0) + 1);

  return partners.map((p) => ({ ...p, deal_count: counts.get(p.id) || 0 }));
}

async function getPartnerById(orgId, partnerId) {
  const path =
    `portal_partners?id=eq.${enc(partnerId)}&org_id=eq.${enc(orgId)}` +
    `&select=${enc(PARTNER_ADMIN_COLUMNS)}&limit=1`;
  const rows = await sbRequest(path);
  return (rows && rows[0]) || null;
}

// A URL-safe handle derived from the firm name. It is not shown anywhere in
// the UI; it exists because portal_deals rows and the legacy env logins are
// keyed by it, and because a stable handle survives a firm being renamed.
function slugifyPartner(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

// Finds a free slug under this org. Appends -2, -3 rather than failing, so
// adding a second "Ray White" is not an error the user has to understand.
async function uniquePartnerSlug(orgId, name) {
  const base = slugifyPartner(name) || 'partner';
  const rows = (await sbRequest(
    `portal_partners?org_id=eq.${enc(orgId)}&slug=like.${enc(`${base}*`)}&select=slug`,
  )) || [];
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 200; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Creates the firm and its first access code in one step. The plaintext code
// is returned to the caller and nowhere else: it is not logged, not stored,
// and not recoverable once the response has been read.
async function insertPartner(orgId, input, author, existingCount = 0) {
  const slug = await uniquePartnerSlug(orgId, input.name);
  const code = generateAccessCode();

  const rows = await sbRequest(`portal_partners?select=${enc(PARTNER_ADMIN_COLUMNS)}`, {
    method: 'POST',
    body: {
      org_id: orgId,
      slug,
      name: input.name,
      kind: input.kind,
      accent: input.accent || PARTNER_ACCENTS[existingCount % PARTNER_ACCENTS.length],
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      access_code_hash: hashAccessCode(orgId, code),
      code_set_at: new Date().toISOString(),
      created_by: author,
      active: true,
    },
    prefer: 'return=representation',
  });

  const partner = (rows && rows[0]) || null;
  return partner ? { partner, code } : null;
}

async function updatePartnerForOrg(orgId, partnerId, patch) {
  const path =
    `portal_partners?id=eq.${enc(partnerId)}&org_id=eq.${enc(orgId)}` +
    `&select=${enc(PARTNER_ADMIN_COLUMNS)}`;
  const rows = await sbRequest(path, {
    method: 'PATCH',
    body: patch,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

// Issues a new code and kills the old one in the same write. This is the only
// recovery path for a lost code, and the only revoke path short of switching
// the firm off entirely.
async function regeneratePartnerCode(orgId, partnerId) {
  const code = generateAccessCode();
  const partner = await updatePartnerForOrg(orgId, partnerId, {
    access_code_hash: hashAccessCode(orgId, code),
    code_set_at: new Date().toISOString(),
  });
  return partner ? { partner, code } : null;
}

// Hard delete, allowed only for a firm with nothing attributed to it. The
// caller checks the count first; this is the second check, because the gap
// between the two is where a concurrent referral would otherwise be orphaned
// by the ON DELETE SET NULL on portal_deals.partner_id.
async function deletePartnerForOrg(orgId, partnerId) {
  const attributed = (await sbRequest(
    `portal_deals?org_id=eq.${enc(orgId)}&partner_id=eq.${enc(partnerId)}&select=id&limit=1`,
  )) || [];
  if (attributed.length) return { error: 'has_deals' };

  await sbRequest(
    `portal_partners?id=eq.${enc(partnerId)}&org_id=eq.${enc(orgId)}`,
    { method: 'DELETE' },
  );
  return { ok: true };
}

// ---- deals --------------------------------------------------------------

function dealsPath({ orgId, partnerId = null, archived = false, internalNotes }) {
  let path =
    `portal_deals?org_id=eq.${enc(orgId)}` +
    `&archived=is.${archived ? 'true' : 'false'}`;

  // The partner filter. This one line is what stops Coastline reading
  // Ashgrove's referrals, and it runs in Postgres, not in the browser.
  if (partnerId) path += `&partner_id=eq.${enc(partnerId)}`;

  path +=
    `&select=${enc(DEAL_COLUMNS)},portal_deal_notes(${enc(NOTE_COLUMNS)})` +
    `&order=updated_at.desc` +
    `&portal_deal_notes.order=created_at.desc`;

  // Internal notes never leave the org. Filtering the embedded resource
  // drops those rows from the response entirely rather than marking them,
  // so there is nothing in the payload for a partner to read.
  if (!internalNotes) path += `&portal_deal_notes.visibility=eq.all`;

  return path;
}

async function listDealsForOrg(orgId, { archived = false } = {}) {
  return (await sbRequest(dealsPath({ orgId, archived, internalNotes: true }))) || [];
}

async function listDealsForPartner(orgId, partnerId, { archived = false } = {}) {
  if (!partnerId) return [];
  return (await sbRequest(dealsPath({ orgId, partnerId, archived, internalNotes: false }))) || [];
}

// Fetches one deal, but only if it belongs to orgId. A deal under another org
// reads as "not found" — the caller cannot tell the difference, which is what
// stops cross-org probing by id.
async function getDealForOrg(dealId, orgId) {
  const path =
    `portal_deals?id=eq.${enc(dealId)}&org_id=eq.${enc(orgId)}` +
    `&select=${enc(DEAL_COLUMNS)}&limit=1`;
  const rows = await sbRequest(path);
  return (rows && rows[0]) || null;
}

async function insertDeal(record) {
  const rows = await sbRequest(`portal_deals?select=${enc(DEAL_COLUMNS)}`, {
    method: 'POST',
    body: record,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

async function updateDealForOrg(dealId, orgId, patch) {
  const path = `portal_deals?id=eq.${enc(dealId)}&org_id=eq.${enc(orgId)}&select=${enc(DEAL_COLUMNS)}`;
  const rows = await sbRequest(path, {
    method: 'PATCH',
    body: patch,
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

// Notes are insert-only. There is intentionally no update or delete helper:
// the activity history must never be rewritten.
//
// authorRole is 'staff' or 'partner'. A partner note is forced to
// visibility 'all' here as well as by the trigger in the second migration:
// an internal note from the referring firm would be one its own author could
// never read back, because every partner query filters on visibility.
async function insertNote(dealId, note, author, visibility = 'all', authorRole = 'staff') {
  const role = authorRole === 'partner' ? 'partner' : 'staff';
  const rows = await sbRequest(`portal_deal_notes?select=${enc(NOTE_COLUMNS)}`, {
    method: 'POST',
    body: {
      deal_id: dealId,
      note,
      created_by: author,
      author_role: role,
      visibility: (role === 'staff' && visibility === 'internal') ? 'internal' : 'all',
    },
    prefer: 'return=representation',
  });
  return (rows && rows[0]) || null;
}

// ---- validation ---------------------------------------------------------
//
// The database is the real gatekeeper (stages are checked by trigger, the
// contact rule by a CHECK constraint). This exists to return a readable
// error before the round trip.

function validateDealInput(input, org, { partial = false } = {}) {
  const errors = [];
  const body = input && typeof input === 'object' ? input : {};
  const stages = (org && Array.isArray(org.stages)) ? org.stages : [];

  const subject = clean(body.subject, MAX.subject);
  const customer_name = clean(body.customer_name, MAX.customer_name);
  const customer_mobile = optional(body.customer_mobile, MAX.customer_mobile);
  const customer_email = optional(body.customer_email, MAX.customer_email);
  const status = clean(body.status, MAX.status);

  // The small print under the headline. Accepts an array or a newline-separated
  // string, because the form sends one field and the API may be called with
  // either.
  let rawDetails = body.subject_details;
  if (typeof rawDetails === 'string') rawDetails = rawDetails.split(/\r?\n/);
  const subject_details = (Array.isArray(rawDetails) ? rawDetails : [])
    .map((d) => clean(d, MAX.detail))
    .filter(Boolean)
    .slice(0, MAX.details);

  if (!partial) {
    if (!subject) errors.push('A short description of the deal is required.');
    if (!customer_name) errors.push('Applicant name is required.');
    if (!status) errors.push('Current stage is required.');
    if (!customer_mobile && !customer_email) {
      errors.push('Enter a mobile or an email address (at least one is required).');
    }
  }

  if (status && stages.length && !stages.includes(status)) {
    errors.push('Choose a valid stage from the list.');
  }
  if (customer_mobile && !isValidAUPhone(customer_mobile)) {
    errors.push('Enter a valid Australian mobile number, for example 0400 000 000.');
  }
  if (customer_email && !isValidEmail(customer_email)) {
    errors.push('Enter a valid email address.');
  }

  // partner_id is deliberately NOT taken from the input here. Which referral
  // firm a deal is attributed to decides who can read it, so the caller
  // resolves a slug against this org's own partner list and sets the id
  // itself (see resolvePartnerId in portal/deals.js). The trigger in the
  // migration is the backstop.
  const record = {
    subject,
    subject_details,
    customer_name,
    customer_mobile,
    customer_email,
    status,
  };

  return { errors, record };
}

function validateNote(text) {
  const note = clean(text, MAX.note);
  if (!note) return { errors: ['Enter a note before saving.'], note: '' };
  return { errors: [], note };
}

// A referral firm, as the brokerage types it in. `partial` is for a PATCH,
// where an untouched field is absent rather than empty.
//
// Only the fields listed here can be written. active, the access code hash
// and org_id are all set by the route from things the caller does not
// control, so no amount of extra keys in the body reaches the table.
function validatePartnerInput(input, { partial = false } = {}) {
  const errors = [];
  const body = input && typeof input === 'object' ? input : {};
  const record = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('name')) {
    const name = clean(body.name, MAX.partner_name);
    if (!name) errors.push('Enter the name of the referral partner.');
    else if (name.length < 2) errors.push('That name is too short.');
    record.name = name;
  }

  if (!partial || has('kind')) record.kind = optional(body.kind, MAX.partner_kind);
  if (!partial || has('contact_name')) record.contact_name = optional(body.contact_name, MAX.contact_name);

  if (!partial || has('contact_email')) {
    const email = optional(body.contact_email, MAX.contact_email);
    if (email && !isValidEmail(email)) errors.push('Enter a valid email address for the contact.');
    record.contact_email = email;
  }

  // Free-text colour goes straight into a style attribute in the browser, so
  // it is checked against a six-digit hex rather than trimmed and hoped for.
  if (has('accent')) {
    const accent = clean(body.accent, 7);
    if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) {
      errors.push('Choose a colour from the list.');
    } else if (accent) {
      record.accent = accent.toLowerCase();
    }
  }

  return { errors, record };
}

module.exports = {
  MAX,
  PARTNER_ACCENTS,
  isConfigured,
  clean,
  optional,
  getOrgBySlug,
  listPartnersForOrg,
  getPartnerBySlug,
  getPartnerByCode,
  partnerHasCode,
  listPartnersAdmin,
  getPartnerById,
  slugifyPartner,
  insertPartner,
  updatePartnerForOrg,
  regeneratePartnerCode,
  deletePartnerForOrg,
  listDealsForOrg,
  listDealsForPartner,
  getDealForOrg,
  insertDeal,
  updateDealForOrg,
  insertNote,
  validateDealInput,
  validateNote,
  validatePartnerInput,
};
