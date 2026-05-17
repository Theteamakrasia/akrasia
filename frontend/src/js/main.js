/**
 * Akrasia — Shared JavaScript v4.0
 * Replaces mock form submission with real API calls.
 * All existing UI behaviour (nav, FAQ, calculator, reveal) is preserved.
 */
(function () {
  'use strict';

  /* ── API base URL ──────────────────────────────────────────
     Change this to your deployed backend URL before going live.
     e.g.  'https://api.akrasia.com/api'
     For local dev with VS Code Live Server: http://localhost:8000/api
  ───────────────────────────────────────────────────────── */
// Line ~13 — after merge, verify this is clean:
const DEFAULT_API_BASE = 'https://akrasia-production.up.railway.app/api';
const API_BASE = String(window.AKRASIA_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  /* ── NAV: scroll state ─────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const tick = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── NAV: hamburger ────────────────────────────────────── */
  const burger  = document.querySelector('.nav-hamburger');
  const mobileN = document.querySelector('.nav-mobile');
  if (burger && mobileN) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileN.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileN.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileN.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('click', e => {
      if (nav && !nav.contains(e.target) && !mobileN.contains(e.target)) {
        burger.classList.remove('open');
        mobileN.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── NAV: active page highlight ────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    if (a.classList.contains('nav-cta')) return;
    const href    = a.getAttribute('href') || '';
    const isHome  = (page === 'index.html' || page === '') &&
                    (href === 'index.html' || href === './' || href === '');
    const isMatch = href && href.split('#')[0] === page && page !== 'index.html';
    if (isHome || isMatch) a.classList.add('active');
  });

  /* ── FAQ accordion ─────────────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── FORM HELPERS ──────────────────────────────────────── */

  /**
   * Collect all named form fields into a plain object.
   * Skips empty strings and converts them to undefined
   * so the backend schema's .optional() validators are satisfied.
   */
  function serializeForm(form) {
    const data = {};
    new FormData(form).forEach((val, key) => {
      // Always include honeypot (even if empty) so the backend can check it
      if (key === 'honeypot') { data[key] = val; return; }
      const trimmed = String(val).trim();
      if (trimmed !== '') data[key] = trimmed;
    });
    return data;
  }

  /**
   * Display field-level validation errors returned by the API.
   */
  function showFieldErrors(form, errors) {
    // Clear previous errors
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control--error').forEach(el =>
      el.classList.remove('form-control--error')
    );

    if (!Array.isArray(errors)) return;

    errors.forEach(({ field, message }) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;
      input.classList.add('form-control--error');
      const msg  = document.createElement('p');
      msg.className = 'field-error';
      msg.style.cssText = 'color:#e05252;font-size:12px;margin:4px 0 0;';
      msg.textContent = message;
      input.parentNode.appendChild(msg);
    });

    // Scroll to first error
    const first = form.querySelector('.form-control--error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Show a banner error message inside the form wrapper.
   */
  function showBannerError(form, message) {
    let banner = form.querySelector('.form-banner-error');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'form-banner-error';
      banner.style.cssText = [
        'background:#1a0808',
        'border:1px solid #7a3030',
        'color:#e05252',
        'padding:12px 16px',
        'font-size:13px',
        'margin-bottom:16px',
        'border-radius:2px',
      ].join(';');
      form.prepend(banner);
    }
    banner.textContent = message;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Reset all error states on a form.
   */
  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control--error').forEach(el =>
      el.classList.remove('form-control--error')
    );
    form.querySelectorAll('.form-banner-error').forEach(el => el.remove());
  }

  /* ── FORM SUBMISSION (contact + order quote) ───────────── */
  document.querySelectorAll('.contact-form, .quote-form').forEach(form => {
    // Determine endpoint based on which form this is
    const isOrderForm   = form.classList.contains('quote-form');
    const endpoint      = isOrderForm ? `${API_BASE}/orders` : `${API_BASE}/contact`;

    let submitting = false;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (submitting) return; // prevent duplicate submissions

      submitting = true;
      clearErrors(form);

      const btn       = form.querySelector('[type=submit]');
      const origText  = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled    = true;

      try {
        const payload = serializeForm(form);

        const response = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          // 422 Validation errors — show per-field
          if (response.status === 422 && result.errors) {
            showFieldErrors(form, result.errors);
          } else if (response.status === 429) {
            showBannerError(form, result.message ||
              'Too many submissions. Please wait a few minutes and try again.');
          } else {
            showBannerError(form, result.message ||
              'Something went wrong. Please try again or email us directly.');
          }
          // Re-enable the button so they can fix errors
          btn.textContent = origText;
          btn.disabled    = false;
          submitting      = false;
          return;
        }

        // ── Success ──────────────────────────────────────────
        form.style.display = 'none';
        const successEl = form
          .closest('.quote-form-wrap, .form-card')
          ?.querySelector('.form-success');
        if (successEl) {
          successEl.style.display = 'block';
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

      } catch (networkErr) {
        // Network error — server unreachable
        showBannerError(form,
          'Could not reach the server. Please check your connection or email us at teamtheakrasia@gmail.com.'
        );
        btn.textContent = origText;
        btn.disabled    = false;
        submitting      = false;
      }
    });
  });

  /* ── Scroll reveal ─────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });
  }

  /* ── PRICING CALCULATOR ────────────────────────────────── */
  const calcForm = document.querySelector('.calc-form');
  if (calcForm) {
    const totalEl = document.querySelector('.calc-result-amount');

    const recalc = () => {
      let total = 0;
      calcForm.querySelectorAll('input[type="checkbox"]:checked').forEach(el => {
        total += parseInt(el.dataset.price || 0, 10);
      });
      calcForm.querySelectorAll('select.calc-select').forEach(el => {
        total += parseInt(el.value || 0, 10);
      });
      if (totalEl) totalEl.textContent = total.toLocaleString('en-BD') + ' BDT';
    };

    calcForm.querySelectorAll('input, select').forEach(el =>
      el.addEventListener('change', recalc)
    );
    recalc();

    const resetBtn = document.querySelector('.calc-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        calcForm.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        calcForm.querySelectorAll('select').forEach(el => el.value = '0');
        recalc();
      });
    }
  }

  /* ── Smooth anchor scrolling ───────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    a.addEventListener('click', e => {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top:      target.getBoundingClientRect().top + window.scrollY - 96,
          behavior: 'smooth',
        });
      }
    });
  });

  /* ── Email links: prevent page navigation ──────────────── */
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', e => e.stopPropagation());
  });

})();
