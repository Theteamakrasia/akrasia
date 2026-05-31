(function () {
  'use strict';

  var mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mm.matches) return;

  var canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;

  // FIX A: Cap DPR at 2.
  // A phone with DPR 3 would otherwise create a canvas ~9× larger than needed.
  // Capping to 2 cuts canvas pixel count by ~56% on those devices with no
  // visible quality difference for a soft animated background.
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // FIX B: Pre-rendered blob texture cache.
  // createRadialGradient is transform-aware — you can't cache the gradient
  // object itself across frames. Instead, render each blob size once to a
  // tiny offscreen canvas and use drawImage (a GPU texture copy) each frame,
  // eliminating ~1,260 CanvasGradient allocations per second.
  var blobCache = {};

  function getBlob(radius) {
    // Bucket to the nearest 4px so the cache stays small even during
    // the collision animation where radius fluctuates continuously.
    var r = Math.max(Math.round(radius / 4) * 4, 4);
    if (blobCache[r]) return blobCache[r];

    // Render at full device-pixel resolution for crisp output.
    var phys = Math.ceil(r * 2 * dpr);
    var oc   = document.createElement('canvas');
    oc.width  = phys;
    oc.height = phys;
    var octx  = oc.getContext('2d');

    // Work in logical (CSS) coordinates on the offscreen canvas.
    octx.scale(dpr, dpr);

    var g = octx.createRadialGradient(
      r * 0.65, r * 0.65, 0,   // highlight shifted up-left (same as original)
      r,        r,        r    // outer edge
    );
    g.addColorStop(0,   '#FFFFFF');
    g.addColorStop(0.3, '#DCDCDC');
    g.addColorStop(0.5, '#ABABAB');
    g.addColorStop(1,   '#8C8C8C');

    octx.beginPath();
    octx.arc(r, r, r, 0, Math.PI * 2);
    octx.fillStyle = g;
    octx.fill();

    blobCache[r] = oc;
    return oc;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Invalidate blob cache — dpr might have changed (e.g. moving between
    // monitors) and the offscreen canvases would be the wrong pixel size.
    blobCache = {};
  }
  window.addEventListener('resize', resize);
  resize();

  function Node(x, y, radius) {
    this.x  = x; this.y = y;
    this.radius     = radius;
    this.baseRadius = radius;
    this.stretch     = 1 + Math.random() * 5;
    this.baseStretch = this.stretch;
    this.angle           = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 0.02;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  var ambientNodes = [];
  var margin = 300;

  // FIX C: Fewer nodes on mobile — reduces per-frame work without
  // changing the visual feel.
  var isMobile = ('ontouchstart' in window) || /Mobi|Android/i.test(navigator.userAgent);
  var count    = isMobile ? 12 : 20;

  function spreadNodes() {
    for (var i = 0; i < count; i++) {
      var r = 15 + Math.random() * 105;
      if (ambientNodes[i]) {
        ambientNodes[i].x = -margin + Math.random() * (W + margin * 2);
        ambientNodes[i].y = -margin + Math.random() * (H + margin * 2);
      } else {
        ambientNodes.push(new Node(
          -margin + Math.random() * (W + margin * 2),
          -margin + Math.random() * (H + margin * 2),
          r
        ));
      }
    }
    ambientNodes.length = count; // trim if count decreased
  }
  window.addEventListener('resize', spreadNodes);
  spreadNodes();

  var cursor = {
    x: W / 2, y: H / 2,
    targetX: W / 2, targetY: H / 2,
    radius: 80, baseRadius: 80,
    stretch: 1, baseStretch: 1,
    angle: 0, angularVelocity: 0
  };

  document.addEventListener('mousemove', function (e) {
    cursor.targetX = e.clientX;
    cursor.targetY = e.clientY;
  });
  document.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    cursor.targetX = t.clientX;
    cursor.targetY = t.clientY;
  }, { passive: true });

  // ── Animation loop ────────────────────────────────────────────────────────
  var rafId    = null;
  var lastTime = null;
  var MAX_MS   = 50;

  // Stop the loop when the page is hidden (tab switch, home button on Android).
  // Reset lastTime so the first frame back doesn't produce a huge dt jump.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId    = null;
      lastTime = null;
    } else if (rafId === null) {
      rafId = requestAnimationFrame(animate);
    }
  });

  function animate(now) {
    rafId = requestAnimationFrame(animate);

    // Delta-time normalised to 60 fps units so movement speed is consistent
    // across 60 / 90 / 120 Hz screens and after dropped frames.
    if (lastTime === null) { lastTime = now; return; }
    var dt = Math.min(now - lastTime, MAX_MS) / 16.667;
    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    cursor.x += (cursor.targetX - cursor.x) * 0.08 * dt;
    cursor.y += (cursor.targetY - cursor.y) * 0.08 * dt;

    for (var i = 0; i < ambientNodes.length; i++) {
      var n = ambientNodes[i];

      n.x     += n.vx * dt;
      n.y     += n.vy * dt;
      n.angle += n.angularVelocity * dt;

      var m = 300;
      if (n.x < -m || n.x > W + m) { n.vx *= -1; n.x = Math.max(-m, Math.min(W + m, n.x)); }
      if (n.y < -m || n.y > H + m) { n.vy *= -1; n.y = Math.max(-m, Math.min(H + m, n.y)); }

      var effectiveR = n.radius * (1 + n.stretch) / 2;
      var dx   = n.x - cursor.x;
      var dy   = n.y - cursor.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var influence = cursor.radius + effectiveR;

      if (dist < influence && dist > 0) {
        var force     = (influence - dist) / influence * 2.5;
        var pushAngle = Math.atan2(dy, dx);
        n.x += Math.cos(pushAngle) * force;
        n.y += Math.sin(pushAngle) * force;
        n.radius  = n.baseRadius  + force * 12;
        n.stretch = n.baseStretch + force * 1.5;
      } else {
        n.radius  += (n.baseRadius  - n.radius)  * 0.08 * dt;
        n.stretch += (n.baseStretch - n.stretch) * 0.08 * dt;
      }
    }

    // Draw using pre-rendered blob textures instead of live gradient fills.
    var total = ambientNodes.length + 1;
    for (var j = 0; j < total; j++) {
      var n    = j < ambientNodes.length ? ambientNodes[j] : cursor;
      var blob = getBlob(n.radius);

      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.angle);
      ctx.scale(n.stretch, 1);
      // Draw blob centred on node origin, scaled to match the live radius.
      ctx.drawImage(blob, -n.radius, -n.radius, n.radius * 2, n.radius * 2);
      ctx.restore();
    }
  }

  rafId = requestAnimationFrame(animate);
})();
