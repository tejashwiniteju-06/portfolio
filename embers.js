/* =====================================================================
   Ember / firefly particles + soft tap pulse (Aurora Night theme)
   - Glowing particles rise slowly, drift sideways and twinkle softly.
     Dark mode: mint / pink / pale-violet fireflies. Light mode: terracotta / amber embers.
   - Every particle follows a slowly turning path with eased velocity.
     No teleporting, no respawning, no edge wrapping: near an edge it steers back.
   - Each glow is drawn ONCE into a small sprite and reused (no shadowBlur).
   - Text and panel rectangles are measured and cached in PAGE coordinates.
     They are refreshed on load, resize, fonts ready, layout changes and shortly
     after scrolling stops. Never on every scroll event.
   - Phones: ~20 particles at 390px, ~30 fps, rest while a finger scrolls,
     device pixel ratio capped at 1.5, canvas sized once (screen.height).
   Colours, blend, size and twinkle depth come from the --ember-* variables in style.css.
   ===================================================================== */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  if (!doc.body || !doc.createElement("canvas").getContext) return;

  var isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  var reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = reduceMQ.matches;
  try { reduceMQ.addEventListener("change", function (e) { reduce = e.matches; }); } catch (e) {}

  var DPR_CAP = 1.5;
  var MIN_DT = isTouch ? 33 : 20;           // ms between frames (~30 fps on phones)
  var SOFT = 26;                             // soft edge around keep-out rectangles (px)

  /* ---------------- canvas ---------------- */
  var cv = doc.createElement("canvas");
  cv.id = "embers";
  cv.setAttribute("aria-hidden", "true");
  doc.body.appendChild(cv);
  var ctx = cv.getContext("2d");
  var dpr = 1, cssW = 0, cssH = 0, viewW = 0;

  function sizeCanvas(force) {
    var w = root.clientWidth || innerWidth;
    var vh = innerHeight;
    /* touch: tall enough once for the largest the viewport can become (address bar hidden) */
    var h = isTouch ? Math.max(screen.height || 0, screen.width || 0, vh) : vh;
    var widthChanged = Math.abs(w - viewW) > 0.5;
    var grow = vh > cssH + 0.5;
    var bigShrink = !isTouch && vh < cssH - 160;
    if (!force && cv.width && !widthChanged && !grow && !bigShrink) return false;
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
    cv.width = bw; cv.height = bh;
    cssW = bw / dpr; cssH = bh / dpr;                  // identical ratio on both axes
    cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
    viewW = w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /* ---------------- theme + sprites ---------------- */
  var theme = { blend: "lighter", boost: 1, size: 1, twinkle: 1, pulse: "", colors: ["110,245,205", "255,130,195", "205,185,255"], core: "255,246,255" };
  var sprites = [], flowerSprite = null;
  function makeSprite(rgb, core) {
    var S = 64, c = doc.createElement("canvas");
    c.width = c.height = S;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(" + core + ",1)");
    g.addColorStop(0.12, "rgba(" + core + ",.92)");
    g.addColorStop(0.3, "rgba(" + rgb + ",.78)");
    g.addColorStop(0.58, "rgba(" + rgb + ",.2)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    return c;
  }
  /* a small five-petal blossom, drawn once and reused (rotated at draw time) */
  function makeFlower(petal, core) {
    var S = 64, c = doc.createElement("canvas");
    c.width = c.height = S;
    var x = c.getContext("2d"), m = S / 2, i;
    var halo = x.createRadialGradient(m, m, 0, m, m, m);
    halo.addColorStop(0, "rgba(" + petal + ",.28)"); halo.addColorStop(1, "rgba(" + petal + ",0)");
    x.fillStyle = halo; x.fillRect(0, 0, S, S);
    for (i = 0; i < 5; i++) {
      x.save(); x.translate(m, m); x.rotate(i * 1.2566 - 1.5708);
      var g = x.createRadialGradient(0, -13, 1, 0, -13, 13);
      g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.45, "rgba(" + petal + ",.95)"); g.addColorStop(1, "rgba(" + petal + ",.8)");
      x.fillStyle = g;
      x.beginPath(); x.ellipse(0, -12, 7.2, 11.5, 0, 0, 6.2832); x.fill();
      x.restore();
    }
    var cg = x.createRadialGradient(m, m, 0, m, m, 6);
    cg.addColorStop(0, "rgba(" + core + ",1)"); cg.addColorStop(1, "rgba(" + core + ",.85)");
    x.fillStyle = cg; x.beginPath(); x.arc(m, m, 5.2, 0, 6.2832); x.fill();
    return c;
  }
  function readTheme() {
    var cs = getComputedStyle(root);
    var g = function (n) { return cs.getPropertyValue(n).trim(); };
    var c1 = g("--ember-1"), c2 = g("--ember-2"), c3 = g("--ember-3"), core = g("--ember-core");
    if (c1 && c2 && c3 && core) { theme.colors = [c1, c2, c3]; theme.core = core; }
    theme.blend = g("--ember-blend") || "lighter";
    theme.boost = parseFloat(g("--ember-boost")) || 1;
    theme.size = parseFloat(g("--ember-size")) || 1;
    theme.twinkle = parseFloat(g("--ember-twinkle")) || 1;
    theme.pulse = g("--ember-pulse") || theme.colors[0];
    theme.flower = g("--flower-petal") || "255,150,200";
    theme.flowerCore = g("--flower-core") || "255,225,140";
    theme.flowerAlpha = parseFloat(g("--flower-alpha")) || 0.9;
    sprites = theme.colors.map(function (c) { return makeSprite(c, theme.core); });
    flowerSprite = makeFlower(theme.flower, theme.flowerCore);
  }
  try { new MutationObserver(readTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] }); } catch (e) {}

  /* ---------------- keep-out rectangles (page coordinates) ---------------- */
  var TEXT_SEL = "h1,h2,h3,h4,p,li,dt,dd,small,figcaption,.btn,.chip,.tabs,.more,.brand,.code,.pill,.sec-tag,.socials,.marquee,.typed-line,.hello,.stat strong,.doc-contact,.foot-bottom";
  var PANEL_SEL = ".pj-hero,.pj-sec,.project,.skill,.fact,.stat,.cert,.doc,.resume-side,.contact-card,.code-window,.about-copy,.float,.cube,.foot-grid";
  var SKIP_SEL = ".navbar,.dots,.to-top,.toast,.lightbox,.marquee li,.details";
  var rects = [];
  var measureTimer = 0, settleTimer = 0, settleTimer2 = 0;

  function measure() {
    var sx = window.pageXOffset || 0, sy = window.pageYOffset || 0;
    var out = [];
    var groups = [[TEXT_SEL, 1], [PANEL_SEL, 2]];
    for (var g = 0; g < groups.length; g++) {
      var nodes = doc.querySelectorAll(groups[g][0]);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        if (el.closest(SKIP_SEL)) {
          /* an open project's details are visible; closed ones are not */
          var d = el.closest(".details");
          if (!(d && d.closest(".project.open") && !el.closest(".navbar,.dots,.to-top,.toast,.lightbox"))) continue;
        }
        out.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy, k: groups[g][1] });
      }
    }
    rects = out;
  }
  function scheduleMeasure(ms) {
    clearTimeout(measureTimer);
    measureTimer = setTimeout(measure, ms);
  }

  /* ---------------- particles ---------------- */
  var parts = [], nextId = 1, simT = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function targetCount() {
    var w = viewW || innerWidth;
    if (isTouch) return Math.max(10, Math.min(36, Math.round(w * 0.052)));   // 390px -> 20
    return Math.max(24, Math.min(64, Math.round(w / 24)));
  }
  function makeParticle(fadeIn) {
    var r = Math.random();
    return {
      id: nextId++,
      x: rnd(0.04, 0.96) * cssW, y: rnd(0.04, 0.96) * cssH,
      vx: 0, vy: 0,
      spd: rnd(12, 28),                 // rise speed, px/s
      side: rnd(0.5, 1.1),              // sideways drift as a fraction of speed
      a: rnd(0, 6.283), wa: rnd(0.12, 0.3),   // slow turning of the drift direction
      b: rnd(0, 6.283), wb: rnd(0.08, 0.2),   // slow rise / sink swell
      h: rnd(0, 6.283), wh: rnd(0.012, 0.035), // slow wandering of the altitude the particle is rising or sinking toward
      d: rnd(0, 6.283), wd: rnd(0.02, 0.05),   // slow, wide sideways wander
      s: rnd(1.3, 3.0),                 // particle radius, px
      c: r < 0.5 ? 0 : r < 0.8 ? 1 : 2,
      flower: Math.random() < 0.32,       // about a third of the particles are small pink flowers
      rot: rnd(0, 6.283), wrot: rnd(0.08, 0.22) * (Math.random() < 0.5 ? -1 : 1),   // slow turning
      f: rnd(0, 6.283), fr: rnd(2.2, 4.6),    // flicker phase and rate
      base: rnd(0.55, 1),
      vis: -1, life: fadeIn ? 0 : 1, dying: false
    };
  }
  function syncCount() {
    var want = targetCount(), active = 0, i;
    for (i = 0; i < parts.length; i++) if (!parts[i].dying) active++;
    while (active < want) { parts.push(makeParticle(true)); active++; }
    for (i = parts.length - 1; i >= 0 && active > want; i--) if (!parts[i].dying) { parts[i].dying = true; active--; }
  }

  /* how much a point is covered by text / panels, plus a push direction out of the text */
  var cov = { t: 0, p: 0, px: 0, py: 0 };
  function keepOut(x, y, sy) {
    var tc = 0, pc = 0, px = 0, py = 0;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i], t = r.t - sy, b = r.b - sy;
      if (y < t - SOFT || y > b + SOFT || x < r.l - SOFT || x > r.r + SOFT) continue;
      var cx = x < r.l ? r.l : x > r.r ? r.r : x;
      var cy = y < t ? t : y > b ? b : y;
      var dx = x - cx, dy = y - cy;
      var inside = dx === 0 && dy === 0;
      var c;
      if (inside) c = 1;
      else {
        var dist = Math.sqrt(dx * dx + dy * dy);
        c = 1 - dist / SOFT;
        if (c <= 0) continue;
        c = c * c * (3 - 2 * c);
      }
      if (r.k === 2) { if (c > pc) pc = c; continue; }
      if (c > tc) {
        tc = c;
        if (inside) {
          var dl = x - r.l, dr = r.r - x, dtp = y - t, dbt = b - y;
          var m = Math.min(dl, dr, dtp, dbt);
          px = m === dl ? -1 : m === dr ? 1 : 0;
          py = m === dtp ? -1 : m === dbt ? 1 : 0;
          if (px && py) py = 0;
          if (m === dtp && !px) py = -1;
        } else {
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          px = (dx / d) * 0.6; py = (dy / d) * 0.6;
        }
      }
    }
    cov.t = tc; cov.p = pc; cov.px = px; cov.py = py;
  }

  function smooth(v) { v = v < 0 ? 0 : v > 1.5 ? 1.5 : v; return v * v * (v < 1 ? (3 - 2 * v) : 1); }

  function step(dt) {
    var mot = reduce ? 0.25 : 1;
    var sy = window.pageYOffset || 0;
    var M = isTouch ? 48 : 70;               // edge steering margin
    var tauV = 1.25, kV = 1 - Math.exp(-dt / tauV);
    var kVis = 1 - Math.exp(-dt / 0.45);
    simT += dt * mot;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.a += p.wa * dt * mot;
      p.b += p.wb * dt * mot;
      p.d += p.wd * dt * mot;
      p.h += p.wh * dt * mot;
      p.f += p.fr * dt * (reduce ? 0.45 : 1);
      p.rot += p.wrot * dt * mot;

      var spd = p.spd * mot;
      var vdx = spd * p.side * Math.sin(p.a) + spd * 0.5 * Math.sin(p.d);
      /* Every particle rises toward (or slowly sinks to) its own wandering altitude, so the
         swarm stays spread over the whole screen instead of collecting along the top edge. */
      var playH = Math.min(cssH, innerHeight);
      var tgt = playH * (0.5 + 0.4 * Math.sin(p.h));
      var gap = (tgt - p.y) / (playH * 0.3);
      gap = gap < -1 ? -1 : gap > 1 ? 1 : gap;
      var vdy = (gap < 0 ? gap : gap * 0.8) * spd * 0.9 - spd * 0.18 * Math.sin(p.b);

      /* near an edge: steer back, smoothly */
      var k = spd * 1.7;
      vdx += smooth((M - p.x) / M) * k - smooth((M - (cssW - p.x)) / M) * k;
      vdy += smooth((M - p.y) / M) * k - smooth((M - (cssH - p.y)) / M) * k;

      /* keep clear of text and panels: dim softly and drift out */
      keepOut(p.x, p.y, sy);
      var pushSpeed = 30 * (reduce ? 0.4 : 1);
      if (cov.t > 0) { vdx += cov.px * pushSpeed * cov.t; vdy += cov.py * pushSpeed * cov.t; }
      var vt = (1 - 0.92 * cov.t) * (1 - 0.5 * cov.p);
      p.vis = p.vis < 0 ? vt : p.vis + (vt - p.vis) * kVis;

      /* eased velocity */
      p.vx += (vdx - p.vx) * kV;
      p.vy += (vdy - p.vy) * kV;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.dying) { p.life -= dt / 1.5; if (p.life <= 0) { parts.splice(i, 1); continue; } }
      else if (p.life < 1) p.life = Math.min(1, p.life + dt / 2.5);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.globalCompositeOperation = theme.blend;
    var visH = innerHeight + 30;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.y > visH) continue;
      var depth = 0.22 * theme.twinkle; if (depth > 0.6) depth = 0.6;
      var flick = 1 - depth + depth * Math.sin(p.f) * (0.65 + 0.35 * Math.sin(p.f * 0.37 + 1.3));
      var alpha = p.base * flick * p.life * p.vis * theme.boost;
      if (alpha < 0.012) continue;
      if (p.flower) {
        /* flowers sway gently instead of flickering */
        var fa = (0.72 + 0.28 * p.base) * (0.86 + 0.14 * Math.sin(p.f * 0.5)) * p.life * p.vis * theme.flowerAlpha;
        if (fa < 0.02) continue;
        var FD = (p.s + 4.2) * 4.3 * (0.94 + 0.06 * Math.sin(p.f * 0.6));
        var co = Math.cos(p.rot + 0.3 * Math.sin(p.b)) * dpr, si = Math.sin(p.rot + 0.3 * Math.sin(p.b)) * dpr;
        ctx.globalAlpha = fa > 1 ? 1 : fa;
        ctx.setTransform(co, si, -si, co, p.x * dpr, p.y * dpr);
        ctx.drawImage(flowerSprite, -FD / 2, -FD / 2, FD, FD);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        continue;
      }
      var D = p.s * 8 * theme.size * (0.94 + 0.06 * Math.sin(p.f * 0.8));
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.drawImage(sprites[p.c], p.x - D / 2, p.y - D / 2, D, D);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------------- loop (phones rest while a finger is scrolling) ---------------- */
  var last = 0, touching = false, lastScroll = 0, frames = 0, DEBUG = !!window.__EMBER_DEBUG, cost = 0, costMax = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (doc.hidden) { last = 0; return; }
    if (!last) { last = now; return; }
    var gap = now - last;
    if (gap < MIN_DT) return;
    var dt = Math.min(gap / 1000, 0.05);     // never a big jump after a pause or a slow frame
    last = now;
    if (isTouch && (touching || now - lastScroll < 160)) return;
    var c0 = DEBUG ? performance.now() : 0;
    step(dt);
    draw();
    if (DEBUG) { cost += performance.now() - c0; if (performance.now() - c0 > costMax) costMax = performance.now() - c0; }
    frames++;
  }

  /* ---------------- events ---------------- */
  var resizeTimer = 0;
  addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (sizeCanvas(false)) syncCount();
      scheduleMeasure(120);
    }, 120);
  });
  addEventListener("scroll", function () {
    lastScroll = performance.now();
    /* measure again shortly after scrolling stops (never per scroll event) */
    clearTimeout(settleTimer); clearTimeout(settleTimer2);
    settleTimer = setTimeout(measure, 220);
    settleTimer2 = setTimeout(measure, 1300);   // after reveal animations finish
  }, { passive: true });
  if (isTouch) {
    addEventListener("touchstart", function () { touching = true; }, { passive: true });
    addEventListener("touchend", function () { touching = false; lastScroll = performance.now(); }, { passive: true });
    addEventListener("touchcancel", function () { touching = false; lastScroll = performance.now(); }, { passive: true });
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { scheduleMeasure(60); });
  function onLoad() { scheduleMeasure(80); setTimeout(measure, 1600); }
  if (doc.readyState === "complete") onLoad(); else addEventListener("load", onLoad);
  /* layout changes (project details, resume tabs, certificate filters) */
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { scheduleMeasure(250); });
    var main = doc.querySelector("main") || doc.body;
    ro.observe(main);
  }
  doc.addEventListener("click", function () { scheduleMeasure(700); });

  /* ---------------- start ---------------- */
  readTheme();
  sizeCanvas(true);
  syncCount();
  measure();
  requestAnimationFrame(frame);

  /* test hook (only when a test sets window.__EMBER_DEBUG before load) */
  if (window.__EMBER_DEBUG) {
    window.__embers = {
      canvas: cv,
      get particles() { return parts; },
      get rects() { return rects; },
      get frames() { return frames; },
      get dpr() { return dpr; },
      get size() { return { w: cssW, h: cssH }; },
      get cost() { return { avg: frames ? cost / frames : 0, max: costMax, frames: frames }; },
      advance: function (sec) { var n = Math.round(sec * 30); for (var i = 0; i < n; i++) step(1 / 30); },
      measure: measure
    };
  }

  /* =====================================================================
     Ember pulse: one soft fading ring with a tiny glow. No splash particles.
     A small canvas is created per effect and removed afterwards.
     On touch it fires only on a real tap (not a scroll or swipe).
     ===================================================================== */
  var pulses = 0, down = null;
  function pulse(x, y) {
    if (reduce || pulses >= 4) return;
    pulses++;
    var SIZE = 128, d = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var px = Math.round(SIZE * d), css = px / d;
    var c = doc.createElement("canvas");
    c.width = c.height = px;
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:fixed;left:" + (x - css / 2) + "px;top:" + (y - css / 2) + "px;width:" + css + "px;height:" + css + "px;pointer-events:none;z-index:1400";
    doc.body.appendChild(c);
    var g = c.getContext("2d");
    g.setTransform(d, 0, 0, d, 0, 0);
    var rgb = theme.pulse || theme.colors[0], mid = css / 2, t0 = 0, DUR = 650;
    function tick(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / DUR;
      if (t >= 1) { c.remove(); pulses--; return; }
      var e = 1 - Math.pow(1 - t, 3);          // ease-out
      var rad = 7 + 40 * e, a = Math.pow(1 - t, 1.6);
      g.clearRect(0, 0, css, css);
      var grad = g.createRadialGradient(mid, mid, 0, mid, mid, rad);
      grad.addColorStop(0, "rgba(" + rgb + "," + (0.1 * a) + ")");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = grad;
      g.beginPath(); g.arc(mid, mid, rad, 0, 6.2832); g.fill();
      g.lineWidth = 6; g.strokeStyle = "rgba(" + rgb + "," + (0.12 * a) + ")";      // tiny glow
      g.beginPath(); g.arc(mid, mid, rad, 0, 6.2832); g.stroke();
      g.lineWidth = 1.8; g.strokeStyle = "rgba(" + rgb + "," + (0.9 * a) + ")";     // the ring
      g.beginPath(); g.arc(mid, mid, rad, 0, 6.2832); g.stroke();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  doc.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") { if (e.button === 0) pulse(e.clientX, e.clientY); return; }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), sy: window.pageYOffset };
  }, { passive: true });
  doc.addEventListener("pointerup", function (e) {
    if (e.pointerType === "mouse" || !down) return;
    var moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y);
    var scrolled = Math.abs((window.pageYOffset || 0) - down.sy);
    var dur = performance.now() - down.t;
    var ok = moved < 10 && scrolled < 3 && dur < 450;
    var x = e.clientX, y = e.clientY;
    down = null;
    if (ok) pulse(x, y);
  }, { passive: true });
  doc.addEventListener("pointercancel", function () { down = null; }, { passive: true });
})();
