/**
 * Main entry point
 * Initialise all global components here.
 */
import { initNavbar } from "./components/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  console.log("🚀 App initialised");
});
