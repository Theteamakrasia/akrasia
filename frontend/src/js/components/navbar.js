/** Mobile hamburger toggle */
export function initNavbar() {
  const hamburger = document.querySelector(".navbar__hamburger");
  const links     = document.querySelector(".navbar__links");

  if (!hamburger || !links) return;

  hamburger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(open));
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove("open");
    }
  });

  // Highlight active link based on current page
  const currentPath = window.location.pathname;
  document.querySelectorAll(".navbar__link").forEach((a) => {
    if (a.getAttribute("href") === currentPath) a.classList.add("active");
  });
}
