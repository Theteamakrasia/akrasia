import { isValidEmail, minLength } from "../utils/validators.js";

document.getElementById("submit-btn")?.addEventListener("click", async () => {
  const name    = document.getElementById("name").value.trim();
  const email   = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const status  = document.getElementById("form-status");
  const btn     = document.getElementById("submit-btn");

  if (!minLength(name, 2))      return alert("Please enter your full name.");
  if (!isValidEmail(email))     return alert("Please enter a valid email.");
  if (!minLength(message, 10))  return alert("Message must be at least 10 characters.");

  // Show loading state
  btn.disabled    = true;
  btn.textContent = "Sending…";

  try {
    const res = await fetch("https://formsubmit.co/ajax/teamtheakrasia@gmail.com", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject:  `New enquiry from ${name}`,
        _captcha:  "false",
        _template: "table",
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Hide form, show success
    document.getElementById("enquiry-form").style.display = "none";
    status.style.display = "block";

  } catch (err) {
    btn.disabled    = false;
    btn.textContent = "Send Enquiry";
    alert("Failed to send. Please email us directly at teamtheakrasia@gmail.com");
  }
});
