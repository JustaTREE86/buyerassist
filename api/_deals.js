// Domain rules for the dealer deal tracker: the canonical stage list, plus
// validation and sanitisation for anything a staff member submits.
//
// DEAL_STATUSES is mirrored by a CHECK constraint on public.deals.status. The
// database is the real gatekeeper; this list exists to return a friendly error
// before the round trip, and is served to the browser by /api/dealer/session
// so the UI never keeps its own copy that can drift out of sync.
const { isValidAUPhone, isValidEmail } = require('./_util');

const DEAL_STATUSES = [
  'New Referral',
  'Contacting Customer',
  'Application Sent',
  'Waiting on Customer',
  'Documents Required',
  'Assessing',
  'Submitted to Lender',
  'Lender Reviewing',
  'Conditional Approval',
  'Approved',
  'Settlement Booked',
  'Settled',
  'Declined',
  'On Hold',
  'Unable to Contact',
  'Cancelled',
];

const MAX = {
  customer_name: 120,
  customer_mobile: 30,
  customer_email: 200,
  vehicle_make: 60,
  vehicle_model: 60,
  vehicle_variant: 80,
  vehicle_registration: 20,
  vehicle_stock_number: 40,
  note: 4000,
  author: 80,
};

// Trim, drop control characters, and cap length. Values are parameterised by
// PostgREST (never string-concatenated into SQL) and React escapes on render,
// so this is about keeping the data clean rather than escaping for a sink.
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

// Returns { errors: [...], record } — record is only meaningful when errors is
// empty. `partial` skips required-field checks for edits that touch a subset.
function validateDealInput(input, { partial = false } = {}) {
  const errors = [];
  const body = input && typeof input === 'object' ? input : {};

  const customer_name = clean(body.customer_name, MAX.customer_name);
  const customer_mobile = optional(body.customer_mobile, MAX.customer_mobile);
  const customer_email = optional(body.customer_email, MAX.customer_email);
  const vehicle_make = clean(body.vehicle_make, MAX.vehicle_make);
  const vehicle_model = clean(body.vehicle_model, MAX.vehicle_model);
  const status = clean(body.status, 40);

  if (!partial) {
    if (!customer_name) errors.push('Customer full name is required.');
    if (!vehicle_make) errors.push('Vehicle make is required.');
    if (!vehicle_model) errors.push('Vehicle model is required.');
    if (!status) errors.push('Current stage is required.');
    if (!customer_mobile && !customer_email) {
      errors.push('Enter a customer mobile or an email address (at least one is required).');
    }
  }

  if (status && !DEAL_STATUSES.includes(status)) {
    errors.push('Choose a valid stage from the list.');
  }
  if (customer_mobile && !isValidAUPhone(customer_mobile)) {
    errors.push('Enter a valid Australian mobile number, for example 0400 000 000.');
  }
  if (customer_email && !isValidEmail(customer_email)) {
    errors.push('Enter a valid email address.');
  }

  let vehicle_year = null;
  if (body.vehicle_year !== '' && body.vehicle_year !== null && body.vehicle_year !== undefined) {
    const n = Number(body.vehicle_year);
    if (!Number.isInteger(n) || n < 1900 || n > 2100) {
      errors.push('Enter a valid vehicle year, for example 2022.');
    } else {
      vehicle_year = n;
    }
  }

  let vehicle_price = null;
  if (body.vehicle_price !== '' && body.vehicle_price !== null && body.vehicle_price !== undefined) {
    const n = Number(body.vehicle_price);
    if (!Number.isFinite(n) || n < 0) {
      errors.push('Enter a valid vehicle price.');
    } else {
      vehicle_price = Math.round(n * 100) / 100;
    }
  }

  const record = {
    customer_name,
    customer_mobile,
    customer_email,
    vehicle_year,
    vehicle_make,
    vehicle_model,
    vehicle_variant: optional(body.vehicle_variant, MAX.vehicle_variant),
    vehicle_registration: optional(body.vehicle_registration, MAX.vehicle_registration),
    vehicle_stock_number: optional(body.vehicle_stock_number, MAX.vehicle_stock_number),
    vehicle_price,
    status,
  };

  return { errors, record };
}

function validateNote(text) {
  const note = clean(text, MAX.note);
  if (!note) return { errors: ['Enter a note before saving.'], note: '' };
  return { errors: [], note };
}

module.exports = { DEAL_STATUSES, MAX, clean, optional, validateDealInput, validateNote };
