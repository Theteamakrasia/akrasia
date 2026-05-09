import { isValidEmail, minLength } from "../utils/validators.js";
import { api } from "../api/client.js";

document.getElementById("submit-btn")?.addEventListener("click", async () => {
  const name    = document.getElementById("name").value;
  const email   = document.getElementById("email").value;
  const message = document.getElementById("message").value;
  const status  = document.getElementById("form-status");

  if (!minLength(name, 2))       return alert("Please enter your full name.");
  if (!isValidEmail(email))      return alert("Please enter a valid email.");
  if (!minLength(message, 10))   return alert("Message must be at least 10 characters.");

  try {
    // Uncomment when backend is ready:
    // await api.post("/contact", { name, email, message });
    console.log("Form data:", { name, email, message });
    status.style.display = "block";
  } catch (err) {
    alert("Something went wrong. Please try again.");
  }
});
