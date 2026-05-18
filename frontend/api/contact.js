/**
 * api/contact.js
 * POST /api/contact — general enquiry from contact.html
 *
 * Flow:
 *  1. Honeypot check
 *  2. Rate limit
 *  3. Validate with Zod
 *  4. Persist to Vercel Postgres
 *  5. Respond 201 immediately
 *  6. Fire-and-forget email
 */

const prisma   = require('./_lib/db');
const { sendSubmissionEmails } = require('./_lib/email');
const { contactSchema, validate } = require('./_lib/validators');
const { hashIp, getClientIp, isHoneypotFilled, isRateLimited } = require('./_lib/helpers');

module.exports = async function handler(req, res) {
  // ── Method guard ─────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const ip        = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;
  const body      = req.body || {};

  // ── 1. Honeypot ───────────────────────────────────────────
  if (isHoneypotFilled(body)) {
    return res.status(200).json({ success: true });
  }

  // ── 2. Rate limit ─────────────────────────────────────────
  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many submissions. Please wait a few minutes and try again.',
    });
  }

  // ── 3. Validate ───────────────────────────────────────────
  const { success, data, errors } = validate(contactSchema, body);
  if (!success) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  const ipHash = hashIp(ip);

  // ── 4. Persist ────────────────────────────────────────────
  let contact;
  try {
    contact = await prisma.contact.create({
      data: {
        name:      data.name,
        email:     data.email,
        message:   data.message,
        sourcePage:'contact',
        ipHash,
        userAgent,
      },
    });
    console.info(`[INFO] CONTACT_SUBMITTED id=${contact.id}`);
  } catch (dbErr) {
    console.error('[ERROR] DB error saving contact', dbErr.message);
    return res.status(500).json({
      success: false,
      message: 'Could not save your submission. Please try again.',
    });
  }

  // ── 5. Respond immediately ────────────────────────────────
  res.status(201).json({
    success: true,
    message: 'Thank you — we will be in touch within 24 hours.',
    id:      contact.id,
  });

  // ── 6. Fire-and-forget email ──────────────────────────────
  sendSubmissionEmails('contact', { ...data, id: contact.id, sourcePage: 'contact.html' })
    .then(() => console.info(`[INFO] CONTACT_EMAILS_SENT id=${contact.id}`))
    .catch((err) => console.error(`[ERROR] Email failed for contact ${contact.id}:`, err.message));
};