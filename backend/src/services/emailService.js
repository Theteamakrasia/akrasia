/**
 * services/emailService.js
 * Handles all outgoing email via Brevo (Sendinblue) API.
 *
 * Two emails are sent on every submission:
 *   1. Notification to teamtheakrasia@gmail.com
 *   2. Confirmation to the submitting client
 *
 * Built-in spam protection:
 *   - HTML escaping of all user-provided content
 *   - Local rate limiter (12 emails/minute)
 *   - Exponential backoff retry on transient errors (429, 5xx)
 *   - Brevo-side DKIM/SPF, bounce tracking, complaint monitoring
 */

const https = require("https");
const config = require("../config");

// ── Spam protection: HTML-escaping ───────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function sanitizeSubject(str) {
  return String(str).replace(/[\r\n]/g, "").trim();
}

// ── Spam protection: local rate limiter ───────────────────────
const rateLimitState = { timestamps: [], maxPerMinute: 12 };

function checkRateLimit() {
  const now = Date.now();
  rateLimitState.timestamps = rateLimitState.timestamps.filter(
    (t) => now - t < 60000
  );
  if (rateLimitState.timestamps.length >= rateLimitState.maxPerMinute) {
    return false;
  }
  rateLimitState.timestamps.push(now);
  return true;
}

// ── Brevo API call ───────────────────────────────────────────
function sendViaBrevo({ to, subject, html }) {
  if (!checkRateLimit()) {
    const err = new Error("Local rate limit exceeded (12/min)");
    err.statusCode = 429;
    return Promise.reject(err);
  }

  const payload = JSON.stringify({
    sender: {
      name: config.brevoSenderName,
      email: config.brevoSenderEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": config.brevoApiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Accept: "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 201) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({});
          }
        } else {
          const err = new Error(
            `Brevo API error: ${res.statusCode}`
          );
          err.statusCode = res.statusCode;
          err.responseBody = body;
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ── Spam protection: retry with backoff ───────────────────────
async function sendWithRetry(options, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await sendViaBrevo(options);
    } catch (err) {
      const isRetryable = [429, 500, 502, 503, 504].includes(
        err.statusCode
      );
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 1s, then 2s
      await new Promise((r) => setTimeout(r, delay));
    }
  }
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
  const isOrder = type === "order";
  const title = isOrder ? "New Project Request" : "New Contact Enquiry";
  const sourcePage = escapeHtml(
    data.sourcePage || (isOrder ? "start.html" : "contact.html")
  );

  const rows = isOrder
    ? [
        ["Name", escapeHtml(data.name)],
        ["Email", escapeHtml(data.email)],
        ["Phone", escapeHtml(data.phone || "—")],
        ["Company", escapeHtml(data.company || "—")],
        ["Service", escapeHtml(data.service)],
        ["Project Type", escapeHtml(data.projectType || "—")],
        ["Budget", escapeHtml(data.budget || "—")],
        ["Timeline", escapeHtml(data.timeline || "—")],
        ["Communication", escapeHtml(data.communication || "—")],
        ["Referral", escapeHtml(data.referralSource || "—")],
        ["Goals", escapeHtml(data.goals), true],
        ["Notes", escapeHtml(data.notes || "—"), true],
      ]
    : [
        ["Name", escapeHtml(data.name)],
        ["Email", escapeHtml(data.email)],
        ["Message", escapeHtml(data.message), true],
      ];

  const rowsHtml = rows
    .map(
      ([label, value, long = false]) =>
        `<div class="field-label">${label}</div>
         <div class="field-value${long ? " long" : ""}">${value}</div>`
    )
    .join("");

  return {
    subject: `[Akrasia] ${title} — ${sanitizeSubject(data.name)}`,
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
  const isOrder = type === "order";
  const firstName = escapeHtml(data.name.split(" ")[0]);

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
          <div class="field-value">${isOrder ? escapeHtml(data.service) : "General enquiry"}</div>
          <div class="field-label">Your reference</div>
          <div class="field-value">${escapeHtml(data.id || "—")}</div>
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
  const company = buildCompanyNotification(type, data);
  const client = buildClientConfirmation(type, data);

  const results = {
    company: { sent: false, error: null },
    client: { sent: false, error: null },
  };

  // Send team notification independently
  try {
    await sendWithRetry({
      to: config.emailTo,
      subject: company.subject,
      html: company.html,
    });

    results.company.sent = true;
    console.log(`✅ Team email sent to ${config.emailTo}`);
  } catch (err) {
    results.company.error = err;
    console.error(
      `❌ Team email failed to ${config.emailTo}: ${err.message}${err.statusCode ? ` (${err.statusCode})` : ""}`
    );
  }

  // Send client confirmation independently
  try {
    if (!data.email) {
      throw new Error("Client email address is missing");
    }

    await sendWithRetry({
      to: data.email,
      subject: client.subject,
      html: client.html,
    });

    results.client.sent = true;
    console.log(`✅ Client email sent to ${data.email}`);
  } catch (err) {
    results.client.error = err;
    console.error(
      `❌ Client email failed to ${data.email}: ${err.message}${err.statusCode ? ` (${err.statusCode})` : ""}`
    );
  }

  return results;
}

module.exports = { sendSubmissionEmails };
