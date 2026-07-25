/**
 * ParticleNetwork — Interactive canvas particle field for portfolio backgrounds.
 *
 * Vanilla JS IIFE. Renders glowing dots connected by proximity lines, with
 * a short 7-dot trail behind the pointer, click ripples, and subtle parallax.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  var CONFIG = {
    /** Canvas element id */
    canvasId: 'particle-canvas',

    /** Particle palette */
    colorCyan: '#38BDF8',
    colorViolet: '#a78bfa',

    /** Movement speeds (very slow drift) */
    baseSpeed: 0.045,
    maxSpeed: 0.35,

    /** Max distance (px) to draw connection lines */
    linkDistance: 130,
    /** Line opacity multiplier (stable — no pulsing) */
    linkAlpha: 0.22,
    linkAlphaLight: 0.14,

    /** Dot radius range */
    dotRadiusMin: 1.2,
    dotRadiusMax: 2.4,
    /** Stable dot alpha — no blink / fade pulse */
    dotAlpha: 0.85,
    dotAlphaLight: 0.65,

    /** Only this many dots follow the pointer (not all nearby) */
    trailCount: 7,
    /** How far behind the pointer the trail stretches (px) */
    trailSpacing: 22,
    /** How far a particle can be to get picked for the trail */
    mouseRadius: 280,
    /** Very gentle pull toward trail slot (lower = slower follow) */
    springStrength: 0.012,
    springDamping: 0.92,
    /** Soft ease factor — dots glide slowly behind the cursor */
    followEase: 0.035,
    /** Max speed while following pointer (keep low for slow trail) */
    followMaxSpeed: 0.65,

    /** Click ripple */
    rippleMaxRadius: 280,
    rippleStrength: 2.8,
    rippleDecay: 0.92,

    /** Subtle parallax factor (fraction of mouse offset from center) */
    parallaxStrength: 0.025,

    /** Device pixel ratio cap */
    maxDpr: 2,

    /** Responsive particle counts */
    counts: {
      mobile: 55,   // < 480
      tablet: 95,   // < 768
      laptop: 140,  // < 1024
      desktop: 180  // >= 1024
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Module state                                                       */
  /* ------------------------------------------------------------------ */

  var canvas = null;
  var ctx = null;
  var particles = [];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var animId = null;
  var running = false;
  var reducedMotion = false;

  /** Pointer state (window-level listeners) */
  var mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    dirX: 0,
    dirY: -1,
    active: false
  };
  var parallax = { x: 0, y: 0 };

  /** Active click ripples: { x, y, radius, strength } */
  var ripples = [];

  /** Cached link distance squared */
  var linkDistSq = CONFIG.linkDistance * CONFIG.linkDistance;

  /* ------------------------------------------------------------------ */
  /*  Theme helpers                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Returns true when the document is in light theme.
   * Checks data-theme="light" on <html>.
   */
  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function getDotAlpha() {
    return isLightTheme() ? CONFIG.dotAlphaLight : CONFIG.dotAlpha;
  }

  function getLinkAlpha() {
    return isLightTheme() ? CONFIG.linkAlphaLight : CONFIG.linkAlpha;
  }

  /** Convert #RRGGBB hex string to rgba(...) with given alpha. */
  function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    return 'rgba(' +
      parseInt(h.substring(0, 2), 16) + ',' +
      parseInt(h.substring(2, 4), 16) + ',' +
      parseInt(h.substring(4, 6), 16) + ',' +
      alpha.toFixed(3) + ')';
  }

  /* ------------------------------------------------------------------ */
  /*  Responsive particle count                                          */
  /* ------------------------------------------------------------------ */

  function getParticleCount() {
    var w = window.innerWidth;
    if (w < 480) return CONFIG.counts.mobile;
    if (w < 768) return CONFIG.counts.tablet;
    if (w < 1024) return CONFIG.counts.laptop;
    return CONFIG.counts.desktop;
  }

  /* ------------------------------------------------------------------ */
  /*  Diamond helpers removed — trail uses simple offset behind cursor   */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /*  Particle factory                                                   */
  /* ------------------------------------------------------------------ */

  function createParticle() {
    var speed = CONFIG.baseSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.baseSpeed) * 0.5;
    var angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: CONFIG.dotRadiusMin + Math.random() * (CONFIG.dotRadiusMax - CONFIG.dotRadiusMin),
      color: Math.random() < 0.55 ? CONFIG.colorCyan : CONFIG.colorViolet,
      /** Trail slot: -1 = free drift, 0..6 = follow pointer */
      slot: -1,
      _tx: 0,
      _ty: 0
    };
  }

  function initParticles() {
    var count = getParticleCount();
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Canvas sizing                                                      */
  /* ------------------------------------------------------------------ */

  function resize() {
    if (!canvas) return;

    var container = canvas.parentElement || document.body;
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Re-seed if count changed */
    var target = getParticleCount();
    if (particles.length !== target) {
      initParticles();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Assign only 7 dots to trail behind the pointer                     */
  /* ------------------------------------------------------------------ */

  /**
   * Pick the closest particles (max trailCount) and place them in a
   * short line behind the cursor. All other dots keep normal drift.
   */
  function assignTrailSlots() {
    var mx = mouse.x;
    var my = mouse.y;
    var radiusSq = CONFIG.mouseRadius * CONFIG.mouseRadius;
    var nearby = [];
    var i;

    for (i = 0; i < particles.length; i++) {
      particles[i].slot = -1;
    }

    if (!mouse.active) return;

    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = p.x - mx;
      var dy = p.y - my;
      var distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        nearby.push({ particle: p, distSq: distSq });
      }
    }

    if (nearby.length === 0) return;

    nearby.sort(function (a, b) { return a.distSq - b.distSq; });

    var count = Math.min(CONFIG.trailCount, nearby.length);
    var backX = -mouse.dirX;
    var backY = -mouse.dirY;
    var len = Math.sqrt(backX * backX + backY * backY) || 1;
    backX /= len;
    backY /= len;

    /* Slight sideways offset so the trail isn't a perfect single line */
    var sideX = -backY;
    var sideY = backX;

    for (var k = 0; k < count; k++) {
      var entry = nearby[k];
      var distBehind = (k + 1) * CONFIG.trailSpacing;
      var sway = ((k % 2 === 0) ? 1 : -1) * (k * 2.2);
      entry.particle.slot = k;
      entry.particle._tx = mx + backX * distBehind + sideX * sway;
      entry.particle._ty = my + backY * distBehind + sideY * sway;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Particle physics update                                            */
  /* ------------------------------------------------------------------ */

  function updateParticle(p) {
    if (reducedMotion) return;

    /* --- Only trail slots follow the pointer (very slowly) --- */
    if (p.slot >= 0 && mouse.active) {
      var sdx = p._tx - p.x;
      var sdy = p._ty - p.y;

      /* Soft ease toward target — slow, smooth glide behind cursor */
      p.vx += sdx * CONFIG.followEase;
      p.vy += sdy * CONFIG.followEase;
      p.vx *= CONFIG.springDamping;
      p.vy *= CONFIG.springDamping;

      /* Extra gentle spring so far dots catch up without rushing */
      p.vx += sdx * CONFIG.springStrength;
      p.vy += sdy * CONFIG.springStrength;
    } else {
      /* --- Gentle ambient drift (majority of dots) --- */
      if (Math.random() < 0.002) {
        var nudge = CONFIG.baseSpeed * 0.4;
        p.vx += (Math.random() - 0.5) * nudge;
        p.vy += (Math.random() - 0.5) * nudge;
      }
    }

    /* --- Ripple repulsion --- */
    for (var r = 0; r < ripples.length; r++) {
      var rip = ripples[r];
      var rdx = p.x - rip.x;
      var rdy = p.y - rip.y;
      var rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      if (rDist < rip.radius && rDist > 0.5) {
        var force = (1 - rDist / rip.radius) * rip.strength * 0.04;
        p.vx += (rdx / rDist) * force;
        p.vy += (rdy / rDist) * force;
      }
    }

    /* --- Clamp speed --- */
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var cap = p.slot >= 0 ? CONFIG.followMaxSpeed : CONFIG.maxSpeed;
    if (speed > cap) {
      p.vx = (p.vx / speed) * cap;
      p.vy = (p.vy / speed) * cap;
    }

    /* --- Integrate position --- */
    p.x += p.vx;
    p.y += p.vy;

    /* --- Soft wrap at edges --- */
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;
  }

  function updateRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      ripples[i].radius += 3.5;
      ripples[i].strength *= CONFIG.rippleDecay;
      if (ripples[i].strength < 0.05 || ripples[i].radius > CONFIG.rippleMaxRadius) {
        ripples.splice(i, 1);
      }
    }
  }

  function updateParallax() {
    if (!mouse.active) {
      parallax.x *= 0.95;
      parallax.y *= 0.95;
      return;
    }
    var cx = width * 0.5;
    var cy = height * 0.5;
    parallax.x = (mouse.x - cx) * CONFIG.parallaxStrength;
    parallax.y = (mouse.y - cy) * CONFIG.parallaxStrength;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Draw connection lines with AABB early-out before distance check.
   */
  function drawLinks() {
    var linkDist = CONFIG.linkDistance;
    var alpha = getLinkAlpha();
    var len = particles.length;

    ctx.lineWidth = 0.6;

    for (var i = 0; i < len; i++) {
      var a = particles[i];
      var ax = a.x + parallax.x;
      var ay = a.y + parallax.y;

      for (var j = i + 1; j < len; j++) {
        var b = particles[j];

        /* AABB early-out — skip if either axis exceeds link distance */
        var dx = a.x - b.x;
        if (Math.abs(dx) > linkDist) continue;
        var dy = a.y - b.y;
        if (Math.abs(dy) > linkDist) continue;

        var distSq = dx * dx + dy * dy;
        if (distSq > linkDistSq) continue;

        var opacity = alpha * (1 - Math.sqrt(distSq) / linkDist);
        ctx.strokeStyle = 'rgba(56, 189, 248, ' + opacity.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(b.x + parallax.x, b.y + parallax.y);
        ctx.stroke();
      }
    }
  }

  function drawParticles() {
    var alpha = getDotAlpha();

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var px = p.x + parallax.x;
      var py = p.y + parallax.y;

      /* Soft glow halo — stable alpha, no pulse */
      ctx.beginPath();
      ctx.arc(px, py, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.color, alpha * 0.15);
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.fill();
    }
  }

  function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawLinks();
    drawParticles();
  }

  /* ------------------------------------------------------------------ */
  /*  Animation loop                                                     */
  /* ------------------------------------------------------------------ */

  function tick() {
    if (!running) return;

    assignTrailSlots();
    updateParallax();
    updateRipples();

    if (!reducedMotion) {
      for (var i = 0; i < particles.length; i++) {
        updateParticle(particles[i]);
      }
    }

    render();
    animId = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ */
  /*  Event handlers (window-level — canvas has pointer-events: none)    */
  /* ------------------------------------------------------------------ */

  function onMouseMove(e) {
    var x = e.clientX;
    var y = e.clientY;

    if (mouse.active && mouse.prevX > -9000) {
      var mdx = x - mouse.prevX;
      var mdy = y - mouse.prevY;
      var mlen = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mlen > 1.5) {
        mouse.dirX = mdx / mlen;
        mouse.dirY = mdy / mlen;
      }
    }

    mouse.prevX = x;
    mouse.prevY = y;
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
  }

  function onMouseLeave() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.prevX = -9999;
    mouse.prevY = -9999;
  }

  function onClick(e) {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      radius: 8,
      strength: CONFIG.rippleStrength
    });
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stop();
    } else if (!reducedMotion) {
      start();
    }
  }

  function onReducedMotionChange(e) {
    reducedMotion = e.matches;
    if (reducedMotion) {
      stop();
    } else if (!document.hidden) {
      start();
    }
  }

  var listenersBound = false;

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('click', onClick, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', onResize);

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = motionQuery.matches;
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', onReducedMotionChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(onReducedMotionChange);
    }
  }

  function onResize() {
    resize();
  }

  function unbindListeners() {
    if (!listenersBound) return;
    listenersBound = false;

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', onResize);
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  function init() {
    canvas = document.getElementById(CONFIG.canvasId);
    if (!canvas) {
      console.warn('[ParticleNetwork] Canvas #' + CONFIG.canvasId + ' not found.');
      return false;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) return false;

    linkDistSq = CONFIG.linkDistance * CONFIG.linkDistance;

    resize();
    initParticles();
    bindListeners();

    if (!reducedMotion && !document.hidden) {
      start();
    }

    return true;
  }

  function start() {
    if (running || reducedMotion || document.hidden) return;
    running = true;
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Export & auto-init                                                 */
  /* ------------------------------------------------------------------ */

  window.ParticleNetwork = {
    init: init,
    resize: resize,
    start: start,
    stop: stop
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
