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

  // ── 3. Persist
  let order;
  try {
    order = await prisma.order.create({
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
    logger.info("ORDER_SUBMITTED", { id: order.id, service: data.service });
  } catch (dbErr) {
    logger.error("DB error saving order", { message: dbErr.message });
    return res.status(500).json({
      success: false,
      message: "Could not save your request. Please try again.",
    });
  }

  // ── 4. Emails
  try {
    await sendSubmissionEmails("order", { ...data, id: order.id, sourcePage: "start.html" });
    logger.info("ORDER_EMAILS_SENT", { id: order.id });
  } catch (emailErr) {
    logger.error("Email sending failed for order", { id: order.id, message: emailErr.message });
  }

  // ── 5. Log submission event
  try {
    await prisma.log.create({
      data: {
        level:   "INFO",
        event:   "ORDER_SUBMITTED",
        message: `New order from ${data.email} for ${data.service}`,
        orderId: order.id,
        ipHash,
      },
    });
  } catch (_) { /* log failures must never block the response */ }

  return res.status(201).json({
    success: true,
    message:
      "Request received — we will send you a formal, itemised proposal within 24 hours.",
    id: order.id,
  });
}

module.exports = { submitOrder };
