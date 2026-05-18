/**
 * api/orders.js
 * POST /api/orders — project quote request from start.html
 *
 * Flow:
 *  1. Honeypot check (bot trap)
 *  2. Rate limit (5 submissions / 15 min / IP)
 *  3. Validate with Zod
 *  4. Persist to Vercel Postgres via Prisma
 *  5. Respond 201 immediately
 *  6. Fire-and-forget: send two emails in background
 */

const prisma   = require('./_lib/db');
const { sendSubmissionEmails } = require('./_lib/email');
const { orderSchema, validate } = require('./_lib/validators');
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
    // Silent 200 to fool bots — don't reveal the trap
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
  const { success, data, errors } = validate(orderSchema, body);
  if (!success) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check the highlighted fields.',
      errors,
    });
  }

  const ipHash = hashIp(ip);

  // ── 4. Persist ────────────────────────────────────────────
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
        sourcePage:     'start',
        ipHash,
        userAgent,
        status:         'NEW',
      },
    });
    console.info(`[INFO] ORDER_SUBMITTED id=${order.id} service=${data.service}`);
  } catch (dbErr) {
    console.error('[ERROR] DB error saving order', dbErr.message);
    return res.status(500).json({
      success: false,
      message: 'Could not save your request. Please try again.',
    });
  }

  // ── 5. Respond immediately ────────────────────────────────
  res.status(201).json({
    success: true,
    message: 'Request received — we will send you a formal, itemised proposal within 24 hours.',
    id:      order.id,
  });

  // ── 6. Fire-and-forget email ──────────────────────────────
  //    res.json() was already called above. The Vercel container stays
  //    warm for a few seconds — more than enough time for SMTP to complete.
  sendSubmissionEmails('order', { ...data, id: order.id, sourcePage: 'start.html' })
    .then(() => console.info(`[INFO] ORDER_EMAILS_SENT id=${order.id}`))
    .catch((err) => console.error(`[ERROR] Email failed for order ${order.id}:`, err.message));
};