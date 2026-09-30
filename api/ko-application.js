// POST /api/ko-application — the KO Cars finance application (/ko-apply).
//
// One job: email the application to Josh. There is no database, no storage
// bucket, no CRM. Documents are not uploaded — the confirmation screen sends
// the customer off to email them.
//
// Deliberately NOT routed through /api/lead: that path POSTs to Make and on
// into GoHighLevel, and Josh wants this form kept out of that pipeline. Nothing
// in this file touches Make, GHL or Formspree.
//
// Delivery is Resend's REST API over plain fetch — this project has no
// package.json and no build step, so every function runs on Node.js as shipped
// by Vercel (same constraint as _util.js and _supabase.js).
//
// It answers {ok:true} ONLY when Resend confirms the send. The browser shows a
// mailto fallback for anything else. Never return a success this function
// cannot vouch for: the Formspree path this project replaced answered 200
// {"ok":true} while binning the lead, and every lead between launch and
// 17 Jul 2026 was lost that way. See decisions/log.md.
const { isValidAUPhone, isValidEmail } = require('./_util');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Where applications land. Overridable so a test deploy can point somewhere
// else without editing code.
const TO = process.env.KO_APPLICATION_TO || 'josh@thebuyerassist.com.au';
// Must be a domain verified in Resend, or the send is rejected.
const FROM = process.env.KO_APPLICATION_FROM || 'KO Cars Applications <applications@thebuyerassist.com.au>';

// Caps on the client-supplied section structure. It is display text pasted
// into an email, so it is bounded and escaped rather than trusted.
const MAX_SECTIONS = 20;
const MAX_ROWS = 60;
const MAX_LABEL = 120;
const MAX_VALUE = 2000;

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const cap = (v, n) => str(v).slice(0, n);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Normalises whatever the browser sent into a bounded [{title, rows}] shape.
// Anything malformed is dropped rather than rejected: the critical fields are
// validated separately below, and a mangled optional row must never cost Josh
// an application.
function normaliseSections(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_SECTIONS).map((s) => {
    const title = cap(s && s.title, MAX_LABEL);
    const rows = Array.isArray(s && s.rows)
      ? s.rows.slice(0, MAX_ROWS)
        .filter((r) => Array.isArray(r) && r.length >= 2)
        .map((r) => [cap(r[0], MAX_LABEL), cap(r[1], MAX_VALUE)])
        .filter(([label, value]) => label && value)
      : [];
    return { title, rows };
  }).filter((s) => s.title && s.rows.length);
}

function validate(b) {
  if (!str(b.name)) return 'Please enter your name.';
  if (str(b.name).length > 200) return 'Please enter a shorter name.';
  if (!isValidAUPhone(b.phone)) return 'Please enter a valid Australian mobile number.';
  if (!isValidEmail(b.email)) return 'Please enter a valid email address.';
  if (!str(b.vehicle)) return 'Please tell us which vehicle you are applying for.';
  if (str(b.vehicleAcknowledged) !== 'Yes') return 'Please confirm the vehicle you are applying to finance.';
  if (str(b.consentToPrivacyPolicy) !== 'Yes') return 'Please accept the Privacy Policy so we can assess your application.';
  return '';
}

function buildText(head, sections) {
  const headBlock = head.map(([k, v]) => `${k}: ${v}`).join('\n');
  const body = sections.map((s) => {
    const rows = s.rows.map(([label, value]) => `  ${label}: ${value}`).join('\n');
    return `${s.title.toUpperCase()}\n${rows}`;
  }).join('\n\n');
  return `${headBlock}\n\n${'='.repeat(48)}\n\n${body}\n`;
}

function buildHtml(head, sections) {
  const headRows = head
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 0;color:#111;font-weight:600">${escapeHtml(v)}</td></tr>`)
    .join('');

  const body = sections.map((s) => {
    const rows = s.rows
      .map(([label, value]) => `<tr><td style="padding:5px 14px 5px 0;color:#6b6b6b;vertical-align:top;width:42%">${escapeHtml(label)}</td><td style="padding:5px 0;color:#111">${escapeHtml(value)}</td></tr>`)
      .join('');
    return `<h3 style="font:600 14px/1.3 -apple-system,Segoe UI,Arial,sans-serif;margin:26px 0 6px;color:#0A1F3D;border-bottom:1px solid #e5e2db;padding-bottom:6px">${escapeHtml(s.title)}</h3><table style="border-collapse:collapse;width:100%;font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif">${rows}</table>`;
  }).join('');

  return `<div style="font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#111;max-width:720px">
<h2 style="font:600 18px/1.3 -apple-system,Segoe UI,Arial,sans-serif;margin:0 0 12px;color:#0A1F3D">KO Cars finance application</h2>
<table style="border-collapse:collapse;font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif">${headRows}</table>
${body}
<p style="margin-top:28px;color:#6b6b6b;font-size:13px">Submitted from /ko-apply. Documents come separately by email, quoting the reference.</p>
</div>`;
}

async function sendViaResend({ subject, text, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const err = new Error('RESEND_API_KEY is not set.');
    err.code = 'NO_KEY';
    throw err;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: replyTo || undefined,
      subject,
      text,
      html,
    }),
  });

  const detail = await res.text().catch(() => '');
  if (!res.ok) {
    const err = new Error(`Resend rejected the send (${res.status}): ${detail.slice(0, 400)}`);
    err.code = 'SEND_FAILED';
    throw err;
  }
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const body = req.body || {};

  // Honeypot — bots that fill every field get a plausible success and nothing
  // is sent. Real customers never see the field.
  if (body.hp) {
    return res.status(200).json({ ok: true, reference: cap(body.reference, 20) });
  }

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  // Trust the browser's reference only if it looks like one; otherwise mint a
  // fresh one so the email always carries something Josh can quote back.
  const supplied = cap(body.reference, 20);
  const reference = /^KO-\d{4}$/.test(supplied)
    ? supplied
    : 'KO-' + String(Math.floor(Math.random() * 9000 + 1000));

  const name = cap(body.name, 200);
  const sections = normaliseSections(body.sections);
  const submittedAt = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane', dateStyle: 'medium', timeStyle: 'short',
  });

  const head = [
    ['Reference', reference],
    ['Applicant', name],
    ['Mobile', cap(body.phone, 40)],
    ['Email', cap(body.email, 200)],
    ['Vehicle', cap(body.vehicle, 200)],
    ['Vehicle confirmed', 'Yes'],
    ['Dealer', cap(body.dealer, 80) || 'KO Cars'],
    ['Submitted', submittedAt],
  ];

  const subject = `KO Cars Application ${reference} — ${name} — ${cap(body.vehicle, 80)}`;

  try {
    await sendViaResend({
      subject,
      text: buildText(head, sections),
      html: buildHtml(head, sections),
      replyTo: cap(body.email, 200),
    });
  } catch (err) {
    // Log the real reason for Josh, tell the customer something useful, and
    // never claim the application arrived.
    console.error('[ko-application] send failed', reference, err && err.message);
    return res.status(502).json({
      ok: false,
      reference,
      error: 'We could not send your application. Please email it through using the button below, or call us.',
    });
  }

  return res.status(200).json({ ok: true, reference });
};
