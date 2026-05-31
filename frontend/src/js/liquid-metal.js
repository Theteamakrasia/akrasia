(function () {
  'use strict';

  var mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mm.matches) return;

  var canvas = document.getElementById('liquid-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H, dpr = window.devicePixelRatio || 1;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
  var count  = 20;
  var margin = 300;

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
  // Cap max step so a tab-switch or GC pause can't teleport nodes
  var MAX_MS   = 50;

  // FIX 2: Pause when hidden, reset timestamp on resume.
  // Without this, returning from another app gives a huge dt → position jump.
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

    // FIX 1: Delta-time normalised to 60 fps units.
    // Every velocity/lerp tuned at 60 fps stays identical on 90/120 Hz
    // screens and recovers cleanly from dropped frames.
    if (lastTime === null) { lastTime = now; return; }
    var dt = Math.min(now - lastTime, MAX_MS) / 16.667;
    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    cursor.x += (cursor.targetX - cursor.x) * 0.08 * dt;
    cursor.y += (cursor.targetY - cursor.y) * 0.08 * dt;

    for (var i = 0; i < ambientNodes.length; i++) {
      var n = ambientNodes[i];

      // FIX 1 applied: scale every per-frame movement by dt
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
        // Collision push is a discrete correction — intentionally NOT scaled by dt
        n.x += Math.cos(pushAngle) * force;
        n.y += Math.sin(pushAngle) * force;
        n.radius  = n.baseRadius  + force * 12;
        n.stretch = n.baseStretch + force * 1.5;
      } else {
        // Lerp snap-back — scale by dt for frame-rate independence
        n.radius  += (n.baseRadius  - n.radius)  * 0.08 * dt;
        n.stretch += (n.baseStretch - n.stretch) * 0.08 * dt;
      }
    }

    // FIX 3: iterate without concat — avoids a heap allocation every frame
    var total = ambientNodes.length + 1; // +1 for cursor
    for (var j = 0; j < total; j++) {
      var n = j < ambientNodes.length ? ambientNodes[j] : cursor;

      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.angle);
      ctx.scale(n.stretch, 1);

      var g = ctx.createRadialGradient(
        -n.radius * 0.35, -n.radius * 0.35, 0,
        0, 0, n.radius
      );
      g.addColorStop(0,   '#FFFFFF');
      g.addColorStop(0.3, '#DCDCDC');
      g.addColorStop(0.5, '#ABABAB');
      g.addColorStop(1,   '#8C8C8C');

      ctx.beginPath();
      ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }
  }

  rafId = requestAnimationFrame(animate);
})();
