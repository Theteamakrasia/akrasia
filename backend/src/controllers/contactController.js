/**
 * controllers/contactController.js
 * Handles POST /api/contact — simple enquiry form submissions.
 */

const prisma                 = require("../database/prisma");
const { sendSubmissionEmails } = require("../services/emailService");
const { contactSchema, validate } = require("../validators/schemas");
const { hashIp, getClientIp, isHoneypotFilled } = require("../utils/helpers");
const logger                 = require("../utils/logger");

/**
 * POST /api/contact
 */
async function submitContact(req, res) {
  // ── 1. Honeypot check (silent discard for bots)
  if (isHoneypotFilled(req.body)) {
    logger.warn("CONTACT honeypot triggered", { ip: getClientIp(req) });
    // Return 200 so bots don't know they were caught
    return res.status(200).json({ success: true });
  }

  // ── 2. Validate input
  const { success, data, errors } = validate(contactSchema, req.body);
  if (!success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const ipHash    = hashIp(getClientIp(req));
  const userAgent = req.headers["user-agent"] || null;

  // ── 3. Persist to database
  let contact;
  try {
    contact = await prisma.contact.create({
      data: {
        name:       data.name,
        email:      data.email,
        message:    data.message,
        sourcePage: "contact",
        ipHash,
        userAgent,
        status:     "PENDING",
      },
    });
    logger.info("CONTACT_SUBMITTED", { id: contact.id, email: data.email });
  } catch (dbErr) {
    logger.error("DB error saving contact", { message: dbErr.message });
    return res.status(500).json({
      success: false,
      message: "Could not save your submission. Please try again.",
    });
  }

  // ── 4. Send emails (non-blocking — don't fail the response if email fails)
  try {
    await sendSubmissionEmails("contact", { ...data, id: contact.id, sourcePage: "contact.html" });
    logger.info("CONTACT_EMAILS_SENT", { id: contact.id });
  } catch (emailErr) {
    // Log but don't expose email failure to the user
    logger.error("Email sending failed for contact", { id: contact.id, message: emailErr.message });
  }

  // ── 5. Respond
  return res.status(201).json({
    success: true,
    message: "Thank you — we will be in touch within 24 hours.",
    id:      contact.id,
  });
}

module.exports = { submitContact };
