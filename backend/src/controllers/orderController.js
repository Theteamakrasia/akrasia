/**
 * controllers/orderController.js
 * Handles POST /api/orders — project quote request from start.html
 */

const prisma                   = require("../database/prisma");
const { sendSubmissionEmails } = require("../services/emailService");
const { orderSchema, validate } = require("../validators/schemas");
const { hashIp, getClientIp, isHoneypotFilled } = require("../utils/helpers");
const logger                   = require("../utils/logger");

/**
 * POST /api/orders
 */
async function submitOrder(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body is missing or empty.",
    });
  }

  // ── 1. Honeypot check
  if (isHoneypotFilled(req.body)) {
    logger.warn("ORDER honeypot triggered", { ip: getClientIp(req) });
    return res.status(200).json({ success: true });
  }

  // ── 2. Validate
  const { success, data, errors } = validate(orderSchema, req.body);
  if (!success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed. Please check the highlighted fields.",
      errors,
    });
  }

  const ipHash    = hashIp(getClientIp(req));
  const userAgent = req.headers["user-agent"] || null;

  // ── 3. Persist to database (best-effort — don't block the response)
  let orderId = null;
  try {
    const order = await prisma.order.create({
      data: {
        name:           data.name,
        email:          data.email,
        phone:          data.phone          || null,
        company:        data.company        || null,
        service:        data.service,
        projectType:    data.projectType    || null,
        budget:         data.budget         || null,
        timeline:       data.timeline       || null,
        goals:          data.goals,
        notes:          data.notes          || null,
        communication:  data.communication  || null,
        referralSource: data.referralSource || null,
        sourcePage:     "start",
        ipHash,
        userAgent,
        status:         "NEW",
      },
    });
    orderId = order.id;
    logger.info("ORDER_SUBMITTED", { id: order.id, service: data.service });
  } catch (dbErr) {
    logger.error("DB error saving order", { message: dbErr.message });
  }

  // ── 4. Emails (independent of DB success — user always gets notified)
  sendSubmissionEmails("order", { ...data, id: orderId, sourcePage: "start.html" })
    .then((results) => {
      logger.info("ORDER_EMAILS_PROCESSED", { 
        id: orderId, 
        teamSent: results.company.sent,
        clientSent: results.client.sent,
        teamError: results.company.error?.message,
        clientError: results.client.error?.message
      });
    })
    .catch((emailErr) => {
      logger.error("Unexpected error in email processing", { 
        id: orderId, 
        message: emailErr.message,
        stack: emailErr.stack
      });
    });

  // ── 5. Log submission event (fire-and-forget, best-effort)
  if (orderId) {
    prisma.log.create({
      data: {
        level:   "INFO",
        event:   "ORDER_SUBMITTED",
        message: `New order from ${data.email} for ${data.service}`,
        orderId: orderId,
        ipHash,
      },
    }).catch((logErr) => {
      logger.error("Failed to log order submission", { error: logErr.message, orderId });
    });
  }

  return res.status(orderId ? 201 : 200).json({
    success: true,
    message:
      "Request received — we will send you a formal, itemised proposal within 24 hours.",
    id: orderId,
  });
}

module.exports = { submitOrder };
