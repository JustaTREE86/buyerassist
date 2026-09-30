// Emails from the dealer deal tracker to KO Cars.
//
// Two messages, both sent through Resend over plain fetch (no npm deps, same
// constraint as ko-application.js):
//   - stage change:     every time staff move a deal to a new stage
//   - invoice request:  from the "Request invoice" button on a deal
//
// Neither message is stored. The deal history gets a one-line note saying the
// email went (or did not), and nothing else: the buyer's date of birth and
// licence number are in the invoice request email only, never in Supabase.
//
// Callers must never let a failed email undo a saved stage change. sendEmail
// throws; the caller catches, logs it on the deal, and tells the UI.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8000;

// Where KO Cars mail goes. Overridable so a test deploy can point at Josh.
const KO_TO = process.env.KO_CARS_NOTIFY_TO || 'ko-cars@hotmail.com';
// Josh gets a copy of every invoice request, and every reply goes to him.
const JOSH = process.env.KO_CARS_NOTIFY_REPLY_TO || 'josh@thebuyerassist.com.au';
// Must be on a domain verified in Resend (thebuyerassist.com.au already is,
// for /ko-apply), or the send is rejected.
const FROM = process.env.KO_CARS_NOTIFY_FROM || 'Josh Marien | The Buyer Assist Group <deals@thebuyerassist.com.au>';

const BOARD_URL = 'https://www.thebuyerassist.com.au/dealer/ko-cars';

const SIGNATURE_TEXT = [
  'Josh Marien',
  'Senior Finance Broker',
  'The Buyer Assist Group',
  '0480 852 530',
  'josh@thebuyerassist.com.au',
].join('\n');

const SIGNATURE_HTML = '<p style="margin:24px 0 0;color:#111">'
  + '<strong>Josh Marien</strong><br>Senior Finance Broker<br>The Buyer Assist Group<br>'
  + '<a href="tel:0480852530" style="color:#0A1F3D">0480 852 530</a><br>'
  + '<a href="mailto:josh@thebuyerassist.com.au" style="color:#0A1F3D">josh@thebuyerassist.com.au</a></p>';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function vehicleTitle(deal) {
  return [deal.vehicle_year, deal.vehicle_make, deal.vehicle_model, deal.vehicle_variant]
    .filter(Boolean).join(' ');
}

// [label, value] rows, blanks dropped.
function rowsText(rows) {
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
}

function rowsHtml(rows) {
  const body = rows.filter(([, v]) => v).map(([k, v]) =>
    `<tr><td style="padding:3px 14px 3px 0;color:#6b6b6b;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>`
    + `<td style="padding:3px 0;color:#111;font-weight:600">${escapeHtml(v)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif">${body}</table>`;
}

function heading(text) {
  return `<p style="margin:20px 0 6px;font:700 12px/1.3 -apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0A1F3D">${escapeHtml(text)}</p>`;
}

function wrapHtml(inner) {
  return `<div style="font:14px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#111;max-width:640px">${inner}</div>`;
}

function paragraphsHtml(text) {
  return String(text).split(/\n{2,}/).map((p) =>
    `<p style="margin:0 0 12px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
}

async function sendEmail({ to, cc, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set.');

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      cc: cc ? [cc] : undefined,
      reply_to: JOSH,
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend rejected the send (${res.status}): ${detail.slice(0, 400)}`);
  }
  return true;
}

// ---- stage change -------------------------------------------------------

function buildStageChangeEmail({ deal, from, to, changedBy }) {
  const vehicle = vehicleTitle(deal) || 'Vehicle to be confirmed';
  const rows = [
    ['Customer', deal.customer_name],
    ['Vehicle', vehicle],
    ['Stock #', deal.vehicle_stock_number],
    ['Rego', deal.vehicle_registration],
    ['Salesperson', deal.salesperson],
    ['Previous stage', from],
    ['New stage', to],
  ];

  const intro = `Quick update on ${deal.customer_name}'s ${vehicle}. It has moved to "${to}".`;
  const outro = 'Full history is on the deal tracker. Any questions, reply here or give me a call.';

  const text = [
    'Hi KO team,', '', intro, '', rowsText(rows), '',
    outro, BOARD_URL, '', SIGNATURE_TEXT,
    '', `(Updated by ${changedBy}.)`,
  ].join('\n');

  const html = wrapHtml(
    paragraphsHtml(`Hi KO team,\n\n${intro}`)
    + rowsHtml(rows)
    + `<p style="margin:18px 0 0">${escapeHtml(outro)} <a href="${BOARD_URL}" style="color:#0A1F3D">Open the deal tracker</a>.</p>`
    + SIGNATURE_HTML
    + `<p style="margin-top:18px;color:#6b6b6b;font-size:12px">Updated by ${escapeHtml(changedBy)}.</p>`,
  );

  return {
    to: KO_TO,
    subject: `Deal update: ${deal.customer_name}, ${vehicle}: ${to}`,
    text,
    html,
  };
}

// ---- invoice request ----------------------------------------------------

function buildInvoiceRequestEmail({ message, buyer, vehicle, finance }) {
  const buyerRows = [
    ['Name', buyer.name],
    ['Address', buyer.address],
    ['Date of birth', buyer.dob],
    ["Driver's licence no.", buyer.licence_no && buyer.licence_state
      ? `${buyer.licence_no} (${buyer.licence_state})` : buyer.licence_no],
    ["Driver's licence expiry", buyer.licence_expiry],
    ['Mobile', buyer.mobile],
    ['Email', buyer.email],
  ];
  const vehicleRows = [
    ['Vehicle', vehicle.title],
    ['Stock #', vehicle.stock],
    ['VIN', vehicle.vin],
    ['Rego', vehicle.rego],
    ['Colour', vehicle.colour],
    ['Odometer', vehicle.odometer ? `${vehicle.odometer} km` : ''],
    ['Price', vehicle.price],
  ];
  const financeRows = [
    ['Finance amount', finance.amount],
    ['Deposit', finance.deposit],
    ['Trade-in', finance.trade_in],
    ['Lender', finance.lender],
  ];

  const text = [
    message, '',
    'INVOICE & DELIVERY TO:', rowsText(buyerRows), '',
    'VEHICLE DETAILS:', rowsText(vehicleRows), '',
    rowsText(financeRows) ? `FINANCE:\n${rowsText(financeRows)}\n` : '',
    'Please send the tax invoice back to me on this email.', '',
    SIGNATURE_TEXT,
  ].join('\n');

  const html = wrapHtml(
    paragraphsHtml(message)
    + heading('Invoice & delivery to') + rowsHtml(buyerRows)
    + heading('Vehicle details') + rowsHtml(vehicleRows)
    + (rowsText(financeRows) ? heading('Finance') + rowsHtml(financeRows) : '')
    + '<p style="margin:20px 0 0">Please send the tax invoice back to me on this email.</p>'
    + SIGNATURE_HTML,
  );

  return {
    to: KO_TO,
    cc: JOSH,
    subject: `Invoice Request - ${buyer.name}`,
    text,
    html,
  };
}

module.exports = {
  KO_TO,
  sendEmail,
  buildStageChangeEmail,
  buildInvoiceRequestEmail,
};
