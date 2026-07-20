// POST /api/lead — receives the two enquiry types that don't go straight to
// AFOS (credit repair, referral partner sign-up), re-validates server-side
// (never trust the client), then POSTs to a Make.com webhook. Make
// creates/updates the GoHighLevel contact, tags it "website-lead" and logs
// the full enquiry as a note. GHL is the system of record; nothing is
// written to a database here. Finance applications never hit this endpoint:
// every loan CTA links straight to an AFOS quick-quote page instead.
//
// This replaced Formspree, which silently classified loan enquiries as spam:
// it returned HTTP 200 {"ok":true} and then binned the lead, so the browser had
// no way to tell a delivered lead from a discarded one. Every lead between
// launch and 17 Jul 2026 was lost that way. Anything that fronts this endpoint
// must fail loudly rather than return a success it cannot vouch for.
const { isValidAUPhone, isValidEmail, toE164AU } = require('./_util');

const MAX_LEN = 4000;
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const opt = (v) => {
  const s = str(v);
  return s && s.length <= MAX_LEN ? s : '';
};

function validate(b) {
  if (!str(b.name)) return 'Please enter your full name.';
  if (str(b.name).length > 200) return 'Please enter a shorter name.';
  if (!isValidAUPhone(b.phone)) return 'Please enter a valid Australian mobile or phone number.';
  if (!isValidEmail(b.email)) return 'Please enter a valid email address.';
  if (b.consentToPrivacyPolicy !== 'Yes') return 'Please accept the Privacy Policy so we can act on your enquiry.';
  return '';
}

// GoHighLevel wants first/last separately. Split here rather than in a Make
// formula so the mapping stays readable and testable.
function splitName(full) {
  const parts = str(full).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const body = req.body || {};

  // Honeypot — bots that fill every field get a fake success, nothing is sent.
  // Real visitors never see this field. Its name is deliberately meaningless:
  // a field called "company" gets filled by Chrome's address autofill, which
  // would silently drop a genuine lead.
  if (body.hp) {
    return res.status(200).json({ ok: true });
  }

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  const { firstName, lastName } = splitName(body.name);
  const submittedAt = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane', dateStyle: 'medium', timeStyle: 'short',
  });

  // Flat, string-only payload so Make maps every field by name with no
  // surprises, matching the debt-busters-outcome convention.
  const payload = {
    reference: opt(body.reference),
    enquiryType: opt(body.enquiryType) || 'Website Enquiry',
    referralSource: opt(body.referralSource) || 'Website',
    loanType: opt(body.loanType),
    amount: opt(body.amount),
    term: opt(body.term),
    purpose: opt(body.purpose),
    name: str(body.name),
    firstName,
    lastName,
    email: str(body.email),
    // E.164 for GHL (lookup + create both need it). phoneDisplay keeps what the
    // enquirer actually typed, for the note a human reads.
    phone: toE164AU(body.phone),
    phoneDisplay: str(body.phone),
    employment: opt(body.employment),
    income: opt(body.income),
    consentToPrivacyPolicy: 'Yes',
    details: opt(body.details),
    business: opt(body.business),
    message: opt(body.message),
    submittedAt,
    sourceUrl: opt(body.sourceUrl),
  };

  const webhookUrl = process.env.MAKE_LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('lead: MAKE_LEAD_WEBHOOK_URL is not configured');
    return res.status(500).json({ ok: false, error: 'This form is not configured yet.' });
  }

  // Formspree emails a copy. It is deliberately best-effort and NEVER decides
  // what we return: it has been proven to classify loan enquiries as spam and
  // discard them while answering HTTP 200 {"ok":true}, so its success means
  // nothing. Make -> GHL is the system of record. If this bins one, the cost is
  // a missed email, never a missed lead. Fire it in parallel with Make so a slow
  // Formspree can't delay the enquirer's confirmation.
  const subject = `${payload.enquiryType} ${payload.reference}: ${payload.name}`;
  const formspreeUrl = process.env.FORMSPREE_ENDPOINT;
  const emailCopy = formspreeUrl
    ? fetch(formspreeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, _subject: subject }),
      }).catch((err) => {
        console.error('lead: formspree copy failed —', err && err.message);
        return null;
      })
    : Promise.resolve(null);

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(`Make webhook error ${resp.status}: ${t.slice(0, 200)}`);
    }
  } catch (err) {
    // Log the failure type only — never the enquirer's personal details.
    console.error('lead: webhook post failed —', err && err.message);
    await emailCopy; // settle it; the function freezes the moment we respond
    return res.status(502).json({ ok: false, error: 'Could not submit your enquiry right now. Please try again shortly.' });
  }

  // Wait for the email copy before responding. Vercel freezes the function as
  // soon as the response is sent, so an un-awaited fetch would be killed
  // mid-flight and the copy would vanish at random.
  await emailCopy;

  return res.status(200).json({ ok: true });
};
