/**
 * Main entry point
 * Initialise all global components here.
 */
/*
import { initNavbar } from "./components/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  console.log("🚀 App initialised");
});
*/

/* ============================================================
   Akrasia — Shared JavaScript  v3.0
   ============================================================ */
(function () {
  'use strict';

  /* ── NAV: scroll state ────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const tick = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── NAV: hamburger ───────────────────────────────── */
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
      if (!nav.contains(e.target) && !mobileN.contains(e.target)) {
        burger.classList.remove('open');
        mobileN.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── NAV: active page highlight ──────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    if (a.classList.contains('nav-cta')) return;
    const href = a.getAttribute('href') || '';
    const isHome  = (page === 'index.html' || page === '') && (href === 'index.html' || href === './' || href === '');
    const isMatch = href && href.split('#')[0] === page && page !== 'index.html';
    if (isHome || isMatch) a.classList.add('active');
  });

  /* ── FAQ accordion ────────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── QUOTE / CONTACT FORM: mock submit ───────────── */
  document.querySelectorAll('.contact-form, .quote-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn  = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        form.style.display = 'none';
        const success = form.closest('.quote-form-wrap, .form-card')
                            ?.querySelector('.form-success');
        if (success) success.style.display = 'block';
      }, 1400);
    });
  });

  /* ── Scroll reveal ────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity  = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });
  }

  /* ── PRICING CALCULATOR
     Total is displayed BELOW the form in .calc-result
     ─────────────────────────────────────────────── */
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
      if (totalEl) {
        totalEl.textContent = total.toLocaleString('en-BD') + ' BDT';
      }
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

  /* ── Smooth anchor scrolling ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    a.addEventListener('click', e => {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 96,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ── EMAIL LINKS: ensure proper mailto behaviour ──
     All email <a> elements should use href="mailto:…"
     This block catches any stray plain-text links and
     does nothing (they are already correct in markup).
     It also prevents any accidental navigation to a
     blank page by ensuring mailto: links never push
     the browser to a new URL.
  ─────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', e => {
      // Let the browser handle it natively — do NOT preventDefault
      // Just stop any parent listeners from interfering
      e.stopPropagation();
    });
  });

})();
