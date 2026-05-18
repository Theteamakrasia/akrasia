/**
 * api/_lib/validators.js
 * Zod schemas — identical to the original backend validators.
 * XSS-safe: HTML tags are stripped from all string inputs.
 */

const { z } = require('zod');

// ── Shared helpers ────────────────────────────────────────────
const sanitisedString = (min, max, label) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must not exceed ${max} characters`)
    .transform((val) => val.replace(/<[^>]*>/g, '').replace(/[<>]/g, ''));

const optionalString = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .transform((val) => val.replace(/<[^>]*>/g, '').replace(/[<>]/g, ''))
    .optional()
    .or(z.literal(''));

// ── Contact schema ────────────────────────────────────────────
const contactSchema = z.object({
  name:     sanitisedString(2, 100, 'Name'),
  email:    z.string().trim().email('A valid email address is required').max(254),
  message:  sanitisedString(10, 3000, 'Message'),
  honeypot: z.literal('').optional(),
});

// ── Order/quote schema ────────────────────────────────────────
const orderSchema = z.object({
  name:           sanitisedString(2, 100, 'Name'),
  email:          z.string().trim().email('A valid email address is required').max(254),
  phone:          optionalString(30,  'Phone'),
  company:        optionalString(150, 'Company'),
  service:        sanitisedString(2, 100,  'Service'),
  projectType:    optionalString(100, 'Project type'),
  budget:         optionalString(100, 'Budget'),
  timeline:       optionalString(100, 'Timeline'),
  goals:          sanitisedString(10, 5000, 'Project goals'),
  notes:          optionalString(3000, 'Notes'),
  communication:  optionalString(60,   'Communication preference'),
  referralSource: optionalString(60,   'Referral source'),
  honeypot:       z.literal('').optional(),
});

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  const errors = result.error.errors.map((e) => ({
    field:   e.path.join('.'),
    message: e.message,
  }));
  return { success: false, data: null, errors };
}

module.exports = { contactSchema, orderSchema, validate };