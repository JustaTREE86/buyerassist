// Shared helpers for the /api serverless functions. CommonJS, no npm deps —
// this project has no build step, so every function must run on plain
// Node.js as shipped by Vercel.
const crypto = require('crypto');

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) {
    // Compare against itself so a length mismatch doesn't short-circuit
    // faster than a real mismatch (rough timing-attack mitigation).
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function isValidAUPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('61')) d = '0' + d.slice(2);
  return /^0[2-478]\d{8}$/.test(d);
}

function isValidEmail(v) {
  return /^\S+@\S+\.\S+$/.test(String(v || '').trim());
}

module.exports = { timingSafeEqualStr, isValidAUPhone, isValidEmail };
