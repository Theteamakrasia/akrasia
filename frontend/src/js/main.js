(function () {
  'use strict';

  /* â”€â”€ NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initNav() {
    var nav = document.querySelector('.nav');
    var hamburger = document.querySelector('.nav-hamburger');
    var mobileMenu = document.querySelector('.nav-mobile');
    var overlay = document.querySelector('.nav-overlay');
    var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    function updateNav() {
      if (!nav) return;
      if (window.scrollY > 20) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    function closeMobile() {
      if (hamburger) hamburger.classList.remove('is-active');
      if (mobileMenu) mobileMenu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    function openMobile() {
      if (hamburger) hamburger.classList.add('is-active');
      if (mobileMenu) mobileMenu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', function () {
        var isOpen = hamburger.classList.contains('is-active');
        if (isOpen) closeMobile();
        else openMobile();
      });
      if (overlay) {
        overlay.addEventListener('click', closeMobile);
      }
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', closeMobile);
      });
    }

    // Mega menu ARIA & keyboard
    var navGroups = document.querySelectorAll('.nav-dropdown-group');
    navGroups.forEach(function (group, i) {
      var trigger = group.querySelector('a');
      var dropdown = group.querySelector('.nav-dropdown');
      if (!trigger || !dropdown) return;

      var id = 'mega-menu-' + i;
      dropdown.id = id;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', id);
      trigger.setAttribute('role', 'button');

      function openMenu() {
        trigger.setAttribute('aria-expanded', 'true');
        group.classList.add('is-open');
      }
      function closeMenu() {
        trigger.setAttribute('aria-expanded', 'false');
        group.classList.remove('is-open');
      }

      group.addEventListener('mouseenter', openMenu);
      group.addEventListener('mouseleave', function (e) {
        if (!e.relatedTarget || !group.contains(e.relatedTarget)) closeMenu();
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
          if (isExpanded) { closeMenu(); } else { openMenu(); var fl = dropdown.querySelector('a'); if (fl) fl.focus(); }
        }
        if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') { closeMenu(); trigger.focus(); }
      });
      dropdown.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeMenu(); trigger.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (!group.contains(e.target) && trigger.getAttribute('aria-expanded') === 'true') closeMenu();
      });
    });

    // Active link highlighting (top-level nav links only)
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    var topLinks = nav.querySelectorAll('.nav-links > a, .nav-dropdown-group > a');
    topLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) link.classList.add('is-active');
    });
    mobileLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) link.classList.add('is-active');
    });
  }

  /* â”€â”€ SCROLL REVEAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-children');
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* â”€â”€ ACCORDION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initAccordion() {
    document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
      var content = trigger.parentElement.querySelector('.accordion-content');
      if (!content) return;

      trigger.addEventListener('click', function () {
        var item = trigger.closest('.accordion-item');
        var wasOpen = item.classList.contains('is-open');
        var group = item.closest('[data-accordion-single]');
        if (group) {
          group.querySelectorAll('.accordion-item.is-open').forEach(function (o) {
            if (o === item) return;
            o.classList.remove('is-open');
            o.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
            var oc = o.querySelector('.accordion-content');
            if (oc) oc.style.maxHeight = '0';
          });
        }
        item.classList.toggle('is-open', !wasOpen);
        trigger.setAttribute('aria-expanded', !wasOpen);
        content.style.maxHeight = wasOpen ? '0' : content.scrollHeight + 'px';
      });
    });
  }

  /* â”€â”€ FORMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initForms() {
    function serialize(form) {
      var data = {};
      var fd = new FormData(form);
      fd.forEach(function (v, k) {
        if (data[k]) { if (!Array.isArray(data[k])) data[k] = [data[k]]; data[k].push(v); }
        else data[k] = v;
      });
      return data;
    }
    function clearErrors(form) {
      form.querySelectorAll('.field-error').forEach(function (el) { el.remove(); });
      form.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
    }
    function showFieldErrors(form, errors) {
      clearErrors(form);
      Object.keys(errors).forEach(function (key) {
        var field = form.querySelector('[name="' + key + '"]');
        if (!field) return;
        var wrap = field.closest('.field') || field.parentElement;
        wrap.classList.add('has-error');
        var err = document.createElement('span');
        err.className = 'field-error';
        err.textContent = errors[key];
        wrap.appendChild(err);
      });
    }
    function showBannerError(form, msg) {
      clearErrors(form);
      var b = document.createElement('div');
      b.className = 'field-error';
      b.style.marginBottom = '1.5rem';
      b.style.padding = '0.75rem 1rem';
      b.style.borderRadius = 'var(--r-md)';
      b.textContent = msg;
      form.insertBefore(b, form.firstChild);
    }

    document.querySelectorAll('form[data-form]').forEach(function (form) {
      var endpoint = form.dataset.endpoint;
      var btn = form.querySelector('[type="submit"]');
      var originalText = btn ? btn.textContent : 'Submit';

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!endpoint) return;
        clearErrors(form);
        if (btn) btn.textContent = 'Sendingâ€¦';

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serialize(form))
        })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, data: data }; }); })
          .then(function (_a) {
            if (!_a.ok) {
              if (_a.data.errors) showFieldErrors(form, _a.data.errors);
              else showBannerError(form, _a.data.message || 'Something went wrong.');
              return;
            }
            form.style.display = 'none';
            var success = document.createElement('div');
            success.innerHTML = '<div style="text-align:center;padding:2rem 0"><p style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;color:var(--accent-primary)">' + (_a.data.message || 'Thank you!') + '</p><p style="color:var(--text-secondary);font-size:0.9rem">' + (_a.data.detail || "We'll be in touch soon.") + '</p></div>';
            form.parentElement.appendChild(success);
          })
          .catch(function () { showBannerError(form, 'Network error. Please check your connection.'); })
          .finally(function () { if (btn) btn.textContent = originalText; });
      });
    });
  }

  /* â”€â”€ CALCULATOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initCalculator() {
    var calcForms = document.querySelectorAll('[data-calculator]');
    calcForms.forEach(function (form) {
      var totalEl = form.querySelector('[data-total]');
      var items = form.querySelectorAll('[data-calc-item]');
      function recalc() {
        var total = 0;
        items.forEach(function (item) {
          var base = parseInt(item.dataset.base || '0', 10);
          var perPage = parseInt(item.dataset.perPage || '0', 10);
          var count = parseInt(item.dataset.count || '1', 10);
          var itemTotal = base + perPage * count;
          var check = item.querySelector('input[type="checkbox"]');
          if (check && !check.checked) itemTotal = 0;
          var select = item.querySelector('select');
          if (select) {
            var opt = select.options[select.selectedIndex];
            itemTotal = parseInt(opt.dataset.price || '0', 10);
          }
          var costEl = item.querySelector('[data-cost]');
          if (costEl) { costEl.textContent = itemTotal.toLocaleString('en-US'); costEl.style.opacity = itemTotal ? '1' : '0.3'; }
          total += itemTotal;
        });
        if (totalEl) totalEl.textContent = total.toLocaleString('en-US');
      }
      form.addEventListener('change', recalc);
      recalc();
    });
  }

  /* â”€â”€ SVG ANIMATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initSvgAnimations() {
    var svgSections = document.querySelectorAll('[data-animate-svg]');
    if (!svgSections.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
          entry.target.querySelectorAll('svg').forEach(function (svg) { svg.classList.add('is-playing'); });
        }
      });
    }, { threshold: 0.15 });
    svgSections.forEach(function (el) { obs.observe(el); });
  }

  /* â”€â”€ MARQUEE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initMarquee() {
    // CSS handles marquee animation; reserved for future interactive speed control
  }

  /* â”€â”€ SMOOTH SCROLL (conditional â€” works from server, falls back from file://) â”€â”€ */
  function initSmoothScroll() {
    // Native smooth scroll for anchor links (always works)
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  /* â”€â”€ PRICING PAGE CALCULATOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initPricingCalc() {
    var selHome = document.getElementById('sel-home');
    var sliderInner = document.getElementById('slider-inner');
    var sliderCount = document.getElementById('slider-count');
    var sliderPrice = document.getElementById('slider-price');
    var innerNote = document.getElementById('inner-tier-note');
    var grandTotal = document.getElementById('calc-grand-total');
    var breakdown = document.getElementById('calc-breakdown');
    var resetBtn = document.getElementById('calc-reset-btn');

    if (!selHome) return; // Not on pricing page

    var innerPrices = { 0: 0, 4000: 2000, 6000: 3000, 8000: 4000 };

    function update() {
      var homeVal = parseInt(selHome.value, 10);
      var innerCount = parseInt(sliderInner.value, 10);
      var innerPricePer = innerPrices[homeVal] || 0;
      var innerCost = innerCount * innerPricePer;
      var pageTotal = homeVal + innerCost;

      if (sliderCount) sliderCount.textContent = innerCount + ' page' + (innerCount !== 1 ? 's' : '');
      if (sliderPrice) sliderPrice.textContent = innerPricePer ? (innerCost.toLocaleString('en-US') + ' BDT') : '0 BDT';
      if (innerNote) innerNote.textContent = homeVal ? (innerPricePer ? 'Inner pages at ' + innerPricePer.toLocaleString('en-US') + ' BDT each' : 'Select a tier to see per-page pricing') : 'Select a homepage tier above to see inner-page pricing.';

      // Add-ons
      var addonTotal = 0;
      var addonRows = [];
      document.querySelectorAll('.calc-item input[type="checkbox"]').forEach(function (cb) {
        var price = parseInt(cb.dataset.price, 10) || 0;
        if (cb.checked) {
          addonTotal += price;
          var name = cb.closest('.calc-item').querySelector('.calc-item-name');
          addonRows.push({ name: name ? name.textContent.trim() : 'Item', price: price });
        }
      });

      var grand = pageTotal + addonTotal;
      if (grandTotal) grandTotal.textContent = grand.toLocaleString('en-US') + ' BDT';

      // Build breakdown
      if (breakdown) {
        var html = '';
        if (homeVal) html += '<div class="calc-row"><span class="calc-name">Homepage</span><span class="calc-cost">' + homeVal.toLocaleString('en-US') + ' BDT</span></div>';
        if (innerCost) html += '<div class="calc-row"><span class="calc-name">Inner pages (' + innerCount + ' Ã— ' + innerPricePer.toLocaleString('en-US') + ')</span><span class="calc-cost">' + innerCost.toLocaleString('en-US') + ' BDT</span></div>';
        addonRows.forEach(function (r) {
          html += '<div class="calc-row"><span class="calc-name">' + r.name + '</span><span class="calc-cost">' + r.price.toLocaleString('en-US') + ' BDT</span></div>';
        });
        breakdown.innerHTML = html;
      }
    }

    selHome.addEventListener('change', update);
    sliderInner.addEventListener('input', update);
    document.querySelectorAll('.calc-item input[type="checkbox"]').forEach(function (cb) { cb.addEventListener('change', update); });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        selHome.selectedIndex = 0;
        sliderInner.value = 0;
        document.querySelectorAll('.calc-item input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
        update();
      });
    }

    update();
  }

  /* â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function init() {
    initNav();
    initScrollReveal();
    initAccordion();
    initForms();
    initCalculator();
    initSvgAnimations();
    initMarquee();
    initSmoothScroll();
    initPricingCalc();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

