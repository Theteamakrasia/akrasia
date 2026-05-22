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

  // ── 3. Persist to database (best-effort — don't block the response)
  let contactId = null;
  try {
    const contact = await prisma.contact.create({
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
    contactId = contact.id;
    logger.info("CONTACT_SUBMITTED", { id: contact.id, email: data.email });
  } catch (dbErr) {
    logger.error("DB error saving contact", { message: dbErr.message });
  }

  // ── 4. Send emails (independent of DB success — user always gets notified)
  try {
    await sendSubmissionEmails("contact", { ...data, id: contactId, sourcePage: "contact.html" });
    logger.info("CONTACT_EMAILS_SENT", { id: contactId });
  } catch (emailErr) {
    logger.error("Email sending failed for contact", { id: contactId, message: emailErr.message });
  }

  // ── 5. Respond (always success — email is the critical path)
  return res.status(contactId ? 201 : 200).json({
    success: true,
    message: "Thank you — we will be in touch within 24 hours.",
    id:      contactId,
  });
}

module.exports = { submitContact };
