/**
 * services/emailService.js
 * Handles all outgoing email via Nodemailer (SMTP).
 *
 * Two emails are sent on every submission:
 *   1. Notification to teamtheakrasia@gmail.com
 *   2. Confirmation to the submitting client
 */

const nodemailer = require("nodemailer");
const config     = require("../config");

// ── Transporter (lazy-initialised) ────────────────────────────
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   config.smtp.host,
      port:   config.smtp.port,
      secure: config.smtp.secure, // true for 465, false for 587
    auth: {
         user: config.smtp.user,
         pass: config.smtp.pass,
       },
       tls: {
         rejectUnauthorized: false, // Allow connection even if TLS cert is problematic (e.g. self-signed)
       },
       connectionTimeout: 30000, // 30s to establish connection
       socketTimeout: 30000,     // 30s for the socket to be active
       // Retry-safe: Nodemailer will retry failed sends automatically
       pool:           true,
       maxConnections: 3,
       rateDelta:      5000,
       rateLimit:      5, // max 5 messages per rateDelta ms
    });
    
    // Verify the connection immediately on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Connection Failed:", error.message, error.code);
      } else {
        console.log("SMTP Connection Established Successfully");
      }
    });
  }
  return transporter;
}

// ── Shared CSS for email templates ────────────────────────────
const emailBaseStyles = `
  body { margin:0; padding:0; background:#0d0d0d; font-family: Georgia, 'Times New Roman', serif; }
  .wrapper { max-width:600px; margin:0 auto; background:#141414; border:1px solid #2a2a2a; }
  .header { background:#141414; padding:32px 40px 24px; border-bottom:1px solid #c9a85c; }
  .logo { font-size:22px; color:#c9a85c; letter-spacing:0.05em; margin:0; }
  .logo span { color:#e8d5a3; }
  .body { padding:32px 40px; color:#b8b0a4; font-size:15px; line-height:1.7; }
  .field-label { font-size:10px; text-transform:uppercase; letter-spacing:0.15em; color:#c9a85c;
                 margin-top:20px; margin-bottom:4px; }
  .field-value { color:#e8d5a3; font-size:15px; border-bottom:1px solid #2a2a2a; padding-bottom:12px; }
  .field-value.long { white-space:pre-wrap; }
  .badge { display:inline-block; background:#1e1a14; border:1px solid #c9a85c; color:#c9a85c;
           font-size:10px; letter-spacing:0.15em; text-transform:uppercase;
           padding:5px 14px; margin-bottom:24px; }
  .footer { padding:24px 40px; border-top:1px solid #2a2a2a; font-size:12px; color:#5a5450; }
  h2 { color:#e8d5a3; font-size:20px; font-weight:400; margin:0 0 16px; }
`;

// ── Template: notification to company ─────────────────────────
function buildCompanyNotification(type, data) {
  const isOrder   = type === "order";
  const title     = isOrder ? "New Project Request" : "New Contact Enquiry";
  const sourcePage = data.sourcePage || (isOrder ? "start.html" : "contact.html");

  const rows = isOrder
    ? [
        ["Name",          data.name],
        ["Email",         data.email],
        ["Phone",         data.phone         || "—"],
        ["Company",       data.company        || "—"],
        ["Service",       data.service],
        ["Project Type",  data.projectType    || "—"],
        ["Budget",        data.budget         || "—"],
        ["Timeline",      data.timeline       || "—"],
        ["Communication", data.communication  || "—"],
        ["Referral",      data.referralSource || "—"],
        ["Goals",         data.goals,          true],
        ["Notes",         data.notes          || "—", true],
      ]
    : [
        ["Name",    data.name],
        ["Email",   data.email],
        ["Message", data.message, true],
      ];

  const rowsHtml = rows
    .map(
      ([label, value, long = false]) =>
        `<div class="field-label">${label}</div>
         <div class="field-value${long ? " long" : ""}">${value}</div>`
    )
    .join("");

  return {
    subject: `[Akrasia] ${title} — ${data.name}`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>${title}</title><style>${emailBaseStyles}</style></head>
      <body><div class="wrapper">
        <div class="header"><p class="logo">Akrasia<span>.</span></p></div>
        <div class="body">
          <div class="badge">${title}</div>
          <h2>You received a new ${isOrder ? "project request" : "enquiry"}.</h2>
          ${rowsHtml}
          <div class="field-label">Submitted at</div>
          <div class="field-value">${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} (Dhaka time)</div>
          <div class="field-label">Source Page</div>
          <div class="field-value">${sourcePage}</div>
        </div>
        <div class="footer">
          Akrasia · Bangladesh · teamtheakrasia@gmail.com
        </div>
      </div></body></html>`,
  };
}

// ── Template: confirmation to client ──────────────────────────
function buildClientConfirmation(type, data) {
  const isOrder   = type === "order";
  const firstName = data.name.split(" ")[0];

  return {
    subject: `We received your ${isOrder ? "project request" : "message"} — Akrasia`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>Request received — Akrasia</title><style>${emailBaseStyles}</style></head>
      <body><div class="wrapper">
        <div class="header"><p class="logo">Akrasia<span>.</span></p></div>
        <div class="body">
          <div class="badge">Request Received</div>
          <h2>Thank you, ${firstName}.</h2>
          <p>
            We have received your ${isOrder ? "project request" : "message"} and
            will reply <strong style="color:#e8d5a3">within 24 hours</strong>
            on business days — personally, never by automation.
          </p>
          ${
            isOrder
              ? `<p>
                  Our reply will include a formal, itemised proposal in BDT tailored
                  to your requirements. If you have any additional details to share
                  before then, simply reply to this email.
                </p>`
              : `<p>
                  If your enquiry is urgent, you can also reach us at
                  <a href="mailto:teamtheakrasia@gmail.com" style="color:#c9a85c">
                  teamtheakrasia@gmail.com</a>.
                </p>`
          }
          <div class="field-label">What you submitted</div>
          <div class="field-value">${isOrder ? data.service : "General enquiry"}</div>
          <div class="field-label">Your reference</div>
          <div class="field-value">${data.id || "—"}</div>
          <br>
          <p style="color:#5a5450; font-size:13px;">
            Team Akrasia · Bangladesh<br>
            <a href="mailto:teamtheakrasia@gmail.com" style="color:#c9a85c">
              teamtheakrasia@gmail.com
            </a>
          </p>
        </div>
        <div class="footer">
          You are receiving this because you submitted a form on akrasia.com.<br>
          No further action is required.
        </div>
      </div></body></html>`,
  };
}

// ── Public API ─────────────────────────────────────────────────
/**
 * sendSubmissionEmails(type, data)
 * @param {"contact"|"order"} type
 * @param {object} data  — validated form payload + { id, sourcePage }
 */
async function sendSubmissionEmails(type, data) {
  const transport = getTransporter();

  const company = buildCompanyNotification(type, data);
  const client  = buildClientConfirmation(type, data);

  const results = {
    company: { sent: false, error: null },
    client:  { sent: false, error: null },
  };

  // Send team notification independently
  try {
    const info = await transport.sendMail({
      from:    config.emailFrom,
      to:      config.emailTo,
      subject: company.subject,
      html:    company.html,
    });
    results.company.sent = true;
    results.company.info = info;
    console.log(`✅ Team email sent to ${config.emailTo}: ${info.messageId}`);
  } catch (error) {
    results.company.error = error;
    console.error(`❌ Team email failed to ${config.emailTo}:`, error.message, error.code);
  }

  // Send client confirmation independently
  try {
    if (!data.email) {
      throw new Error("Client email address is missing");
    }
    const info = await transport.sendMail({
      from:    config.emailFrom,
      to:      data.email,
      subject: client.subject,
      html:    client.html,
    });
    results.client.sent = true;
    results.client.info = info;
    console.log(`✅ Client email sent to ${data.email}: ${info.messageId}`);
  } catch (error) {
    results.client.error = error;
    console.error(`❌ Client email failed to ${data.email}:`, error.message, error.code);
  }

  // Always return results, never throw
  return results;
}

module.exports = { sendSubmissionEmails };
