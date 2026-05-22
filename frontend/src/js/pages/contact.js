import { isValidEmail, minLength } from "../utils/validators.js";
import ENV from "../config/env.js";

document.getElementById("submit-btn")?.addEventListener("click", async () => {
  const name    = document.getElementById("name").value.trim();
  const email   = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const status  = document.getElementById("form-status");
  const btn     = document.getElementById("submit-btn");
  const form    = document.getElementById("enquiry-form");

  if (!minLength(name, 2))      return alert("Please enter your full name.");
  if (!isValidEmail(email))     return alert("Please enter a valid email.");
  if (!minLength(message, 10))  return alert("Message must be at least 10 characters.");

  btn.disabled    = true;
  btn.textContent = "Sending…";

  try {
    const res = await fetch(`${ENV.API_BASE_URL}/contact`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 422 && data.errors) {
        const msgs = data.errors.map((e) => e.message).join("\n");
        throw new Error(msgs);
      }
      throw new Error(data.message || "Something went wrong. Please try again.");
    }

    form.style.display = "none";
    status.style.display = "block";

  } catch (err) {
    btn.disabled    = false;
    btn.textContent = "Send Enquiry";
    alert(err.message || "Failed to send. Please email us directly at teamtheakrasia@gmail.com");
  }
});
