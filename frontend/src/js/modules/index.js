/* ============================================================
   Akrasia v2 — Modular JavaScript
   ============================================================ */

// Module: Navigation
// --------------------------------------------------
export function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  // Scroll detection
  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('is-active');
      mobileMenu.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen && mobileLinks.length) {
        // Close on escape
        const onKey = (e) => {
          if (e.key === 'Escape') {
            hamburger.classList.remove('is-active');
            mobileMenu.classList.remove('is-open');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
          }
        };
        document.addEventListener('keydown', onKey);
      }
    });

    mobileLinks?.forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-active');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlighting based on URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  nav?.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });

  mobileLinks?.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('is-active');
    }
  });
}

// Module: Scroll Reveal
// --------------------------------------------------
export function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-children');

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// Module: Accordion
// --------------------------------------------------
export function initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const wasOpen = item.classList.contains('is-open');

      // Close all siblings if single-open group
      const group = item.closest('[data-accordion-single]');
      if (group) {
        group.querySelectorAll('.accordion-item.is-open').forEach((openItem) => {
          openItem.classList.remove('is-open');
        });
      }

      item.classList.toggle('is-open', !wasOpen);
    });
  });
}

// Module: Smooth Scroll (Lenis)
// --------------------------------------------------
export async function initSmoothScroll() {
  try {
    const { default: Lenis } = await import('lenis');
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate with nav anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });

    return lenis;
  } catch (err) {
    console.warn('Lenis not loaded, falling back to native scroll', err);
    // Fallback: native smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    return null;
  }
}

// Module: Forms
// --------------------------------------------------
import ENV from "../config/env.js";

export function initForms() {
  function serialize(form) {
    const data = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (data[key]) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    return data;
  }

  function showFieldErrors(form, errors) {
    clearErrors(form);
    Object.entries(errors).forEach(([key, msg]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (!field) return;
      const wrap = field.closest('.field') || field.parentElement;
      wrap.classList.add('has-error');
      const errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      errorEl.textContent = msg;
      wrap.appendChild(errorEl);
    });
  }

  function showBannerError(form, message) {
    clearErrors(form);
    const errorBanner = document.createElement('div');
    errorBanner.className = 'field-error';
    errorBanner.style.marginBottom = '1.5rem';
    errorBanner.style.padding = '0.75rem 1rem';
    errorBanner.style.background = 'rgba(229, 115, 115, 0.1)';
    errorBanner.style.border = '1px solid rgba(229, 115, 115, 0.2)';
    errorBanner.style.borderRadius = 'var(--r-md)';
    errorBanner.textContent = message;
    form.insertBefore(errorBanner, form.firstChild);
  }

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
    form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
  }

  document.querySelectorAll('form[data-form]').forEach((form) => {
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn?.textContent || 'Submit';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!endpoint) return;
      clearErrors(form);
      if (btn) btn.textContent = 'Sending\u2026';

      try {
        const response = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serialize(form)),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 422 && data.errors) {
            const fieldErrors = {};
            data.errors.forEach((e) => { fieldErrors[e.field] = e.message; });
            showFieldErrors(form, fieldErrors);
            return;
          }
          throw new Error(data.message || 'Something went wrong. Please try again.');
        }

        form.style.display = 'none';
        const success = document.createElement('div');
        success.innerHTML = `
          <div style="text-align:center; padding: 2rem 0;">
            <p style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--accent);">
              Enquiry sent!
            </p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              We\u2019ll reply within 24 hours with a formal proposal.
            </p>
          </div>
        `;
        form.parentElement.appendChild(success);
      } catch (err) {
        showBannerError(form, err.message || 'Failed to send. Please email us directly at teamtheakrasia@gmail.com');
      } finally {
        if (btn) btn.textContent = originalText;
      }
    });
  });
}

// Module: Pricing Calculator
// --------------------------------------------------
export function initCalculator() {
  const calcForms = document.querySelectorAll('[data-calculator]');

  calcForms.forEach((form) => {
    const totalEl = form.querySelector('[data-total]');
    const items = form.querySelectorAll('[data-calc-item]');

    function recalc() {
      let total = 0;
      items.forEach((item) => {
        const base = parseInt(item.dataset.base || '0', 10);
        const perPage = parseInt(item.dataset.perPage || '0', 10);
        const count = parseInt(item.dataset.count || '1', 10);
        let itemTotal = base + perPage * count;

        // Checkboxes
        const check = item.querySelector('input[type="checkbox"]');
        if (check && !check.checked) itemTotal = 0;

        // Selects
        const select = item.querySelector('select');
        if (select) {
          const opt = select.options[select.selectedIndex];
          itemTotal = parseInt(opt.dataset.price || '0', 10);
        }

        // Update display
        const costEl = item.querySelector('[data-cost]');
        if (costEl) {
          costEl.textContent = itemTotal.toLocaleString('en-IN');
          costEl.style.opacity = itemTotal ? '1' : '0.3';
        }

        total += itemTotal;
      });

      if (totalEl) {
        totalEl.textContent = total.toLocaleString('en-IN');
      }
    }

    form.addEventListener('change', recalc);
    recalc();
  });
}

// Module: SVG Animations (triggered on scroll for perf)
// --------------------------------------------------
export function initSvgAnimations() {
  const svgSections = document.querySelectorAll('[data-animate-svg]');

  if (!svgSections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
          // Find child SVGs and trigger play
          entry.target.querySelectorAll('svg').forEach((svg) => {
            svg.classList.add('is-playing');
          });
        }
      });
    },
    { threshold: 0.15 }
  );

  svgSections.forEach((el) => observer.observe(el));
}

// Module: Marquee speed variation
// --------------------------------------------------
export function initMarquee() {
  const marquees = document.querySelectorAll('.marquee');
  marquees.forEach((mq) => {
    const track = mq.querySelector('.marquee-track');
    if (!track) return;
    // Marquee CSS animation handles everything
    // This module reserve for future interactive speed changes
  });
}

// Initialize everything
// --------------------------------------------------
export async function initAll() {
  initNav();
  initScrollReveal();
  initAccordion();
  initForms();
  initCalculator();
  initSvgAnimations();
  initMarquee();

  // Lenis smooth scroll
  await initSmoothScroll();
}
