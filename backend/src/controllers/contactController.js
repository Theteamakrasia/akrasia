/**
 * controllers/contactController.js
 * Handles POST /api/contact — general enquiry from contact.html
 */

const prisma                      = require('../database/prisma');
const { sendSubmissionEmails }    = require('../services/emailService');
const { contactSchema, validate } = require('../validators/schemas');
const { hashIp, getClientIp, isHoneypotFilled } = require('../utils/helpers');
const logger                      = require('../utils/logger');

/**
 * POST /api/contact
 */
async function submitContact(req, res) {
  // ── 1. Honeypot check ────────────────────────────────────
  if (isHoneypotFilled(req.body)) {
    logger.warn('CONTACT honeypot triggered', { ip: getClientIp(req) });
    return res.status(200).json({ success: true });
  }

  // ── 2. Validate ──────────────────────────────────────────
  const { success, data, errors } = validate(contactSchema, req.body);
  if (!success) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  const ipHash    = hashIp(getClientIp(req));
  const userAgent = req.headers['user-agent'] || null;

  // ── 3. Persist ───────────────────────────────────────────
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
    logger.info('CONTACT_SUBMITTED', { id: contact.id });
  } catch (dbErr) {
    logger.error('DB error saving contact', { message: dbErr.message });
    return res.status(500).json({
      success: false,
      message: 'Could not save your submission. Please try again.',
    });
  }

  // ── 4. Respond immediately — do NOT await email ──────────
  res.status(201).json({
    success: true,
    message: 'Thank you — we will be in touch within 24 hours.',
    id:      contact.id,
  });

  // ── 5. Fire-and-forget emails (after response is sent) ───
  sendSubmissionEmails('contact', { ...data, id: contact.id, sourcePage: 'contact.html' })
    .then(() => logger.info('CONTACT_EMAILS_SENT', { id: contact.id }))
    .catch(emailErr =>
      logger.error('Email sending failed for contact', { id: contact.id, message: emailErr.message })
    );
}

module.exports = { submitContact };