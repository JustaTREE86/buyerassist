// POST /api/debt-busters-outcome — receives the hidden staff form submission
// from /staff/debt-busters, re-validates everything server-side (never trust
// the client), then POSTs the outcome to a Make.com webhook. Make creates/
// updates the client's GoHighLevel contact (so Leonie retains the data),
// logs the full outcome as a note, and tags the contact so a GHL workflow
// emails the outcome to Debt Busters plus an internal copy. Nothing is
// written to a database here — GHL is the system of record.
const { timingSafeEqualStr, isValidAUPhone, isValidEmail } = require('./_util');

const OUTCOME_OPTIONS = [
  'Unable to assist',
  'Unable to contact',
  'Client no longer wishes to proceed',
  'Client did not provide requested information',
  'Credit profile unsuitable',
  'Serviceability not met',
  'Insufficient income',
  'Employment does not meet lender requirements',
  'Existing debts too high',
  'Requested amount not suitable',
  'Client requires further Debt Busters assistance',
  'Other',
];

const MAX_LEN = 4000;
const req = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= MAX_LEN;

function validate(b) {
  if (!req(b.staffName)) return 'Please enter the Buyer Assist staff member name.';
  if (!req(b.clientFirstName)) return 'Please enter the client’s first name.';
  if (!req(b.clientSurname)) return 'Please enter the client’s surname.';
  if (!isValidAUPhone(b.clientPhone)) return 'Please enter a valid Australian client phone number.';
  if (!isValidEmail(b.clientEmail)) return 'Please enter a valid client email address.';
  if (!b.dateContacted || Number.isNaN(Date.parse(b.dateContacted))) return 'Please enter a valid date contacted.';
  if (new Date(b.dateContacted) > new Date()) return 'Date contacted can’t be in the future.';
  const attempts = Number(b.contactAttempts);
  if (!Number.isInteger(attempts) || attempts < 0) return 'Please enter a valid number of contact attempts.';
  const amount = Number(b.requestedAmount);
  if (!(amount > 0)) return 'Please enter a valid requested loan amount.';
  if (!req(b.reasonForReferral)) return 'Please enter the reason for referral.';
  if (!OUTCOME_OPTIONS.includes(b.outcome)) return 'Please select a valid outcome.';
  if (b.outcome === 'Unable to assist' && !req(b.reasonUnableToAssist)) return 'Please enter the reason unable to assist.';
  if (b.outcome === 'Other' && !req(b.otherExplanation)) return 'Please explain the outcome, since you selected "Other".';
  if (b.additionalNotes && b.additionalNotes.length > MAX_LEN) return 'Additional notes are too long.';
  return '';
}

module.exports = async function handler(req_, res) {
  if (req_.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const staffPassword = process.env.DEBT_BUSTERS_STAFF_PASSWORD;
  if (!staffPassword) {
    console.error('debt-busters-outcome: DEBT_BUSTERS_STAFF_PASSWORD is not configured');
    return res.status(500).json({ ok: false, error: 'This form is not configured yet.' });
  }

  const body = req_.body || {};
  if (typeof body.password !== 'string' || !timingSafeEqualStr(body.password, staffPassword)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  // Honeypot — bots that fill every field get a fake success, no email sent.
  if (body.company) {
    return res.status(200).json({ ok: true });
  }

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  const {
    staffName, clientFirstName, clientSurname, clientPhone, clientEmail,
    dateContacted, contactAttempts, requestedAmount, reasonForReferral, outcome,
    reasonUnableToAssist, otherExplanation, additionalNotes,
  } = body;

  const clientName = `${clientFirstName} ${clientSurname}`.trim();
  const submittedAt = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', dateStyle: 'medium', timeStyle: 'short' });

  // Flat, string-only payload so Make maps every field by name with no
  // surprises. Amount and attempts are pre-formatted here so the GHL note
  // and outcome email read cleanly without extra Make formulas.
  const payload = {
    clientFirstName,
    clientSurname,
    clientName,
    clientPhone,
    clientEmail,
    dateContacted,
    contactAttempts: String(contactAttempts),
    requestedAmount: `$${Number(requestedAmount).toLocaleString('en-AU')}`,
    reasonForReferral,
    outcome,
    reasonUnableToAssist: reasonUnableToAssist || '',
    otherExplanation: otherExplanation || '',
    additionalNotes: additionalNotes || '',
    staffName,
    submittedAt,
  };

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('debt-busters-outcome: MAKE_WEBHOOK_URL is not configured');
    return res.status(500).json({ ok: false, error: 'This form is not configured yet. Please contact Debt Busters directly for now.' });
  }

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
    // Log the failure type only — never the client's personal details.
    console.error('debt-busters-outcome: webhook post failed —', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not submit the outcome right now. Please try again shortly.' });
  }

  return res.status(200).json({ ok: true });
};
