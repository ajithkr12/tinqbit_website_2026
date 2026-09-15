/**
 * ============================================================
 * Hero particles — ambient field + a particle-built logo
 * ============================================================
 *
 * A single Canvas2D layer drawn on top of the hero video
 * (`mix-blend-mode: screen`, see CSS) with three particle groups,
 * drawn back-to-front so nearer layers occlude farther ones:
 *
 *  - "deep" particles: a dense pool of faint, tiny, slow-drifting
 *    specks — the farthest layer, giving the field real depth instead
 *    of reading as one flat plane of dots. Purely decorative.
 *  - "field" particles: the mid-depth pool of tiny embers drifting
 *    upward, brighter and a little faster/larger than the deep layer.
 *    Purely decorative, no interaction.
 *  - "logo" particles: sampled from the alpha channel of the brand
 *    mark (/assets/logo.png) and springed toward those sample points,
 *    so together they read as the logo. They idle with a gentle
 *    per-particle wobble and, on fine-pointer devices, are repelled
 *    away from the cursor and ease back into shape when it moves off.
 *    While they're being repelled, the particles react visually without
 *    any extra sound effect.
 *
 * Counts (see countsForWidth) are tuned to the densest field that still
 * holds 60fps in testing — not an arbitrary "more is better" number.
 * Canvas2D draws each particle with its own arc()+fill() call, so total
 * count is the main cost lever; pushing it further starts costing frame
 * time before it reads as visually denser.
 *
 * The canvas is `pointer-events: none` — mouse tracking listens on
 * the hero section itself, so clicks/taps on anything in the hero
 * are never intercepted.
 *
 * Usage: <canvas data-hero-particles data-logo-src="/assets/logo.png">
 *   as a child of the `.hero` section.
 */
(function () {
  "use strict";

  var SELECTOR = "[data-hero-particles]";
  var MOBILE_BREAKPOINT = 600; // px
  var TABLET_BREAKPOINT = 1024; // px

  var SPRING = 0.022; // logo particle: pull toward target, per frame
  var DAMPING = 0.9; // logo particle: velocity decay, per frame
  var REPEL_RADIUS = 110; // px; mouse influence radius
  var REPEL_STRENGTH = 1.7; // px/frame^2 impulse at the mouse position

  var CHIME_MIN_INTERVAL = 90; // ms; floor between two chime notes, however many particles are disturbed at once
  var CHIME_FREQ_MIN = 900; // Hz
  var CHIME_FREQ_MAX = 1900; // Hz
  var CHIME_VOLUME = 0.05; // peak gain; kept low — this is a texture, not an alert
  var CHIME_DURATION = 0.18; // seconds

  var CYAN = "69,191,229"; // brand accent, matches --cyan
  var WHITE = "255,255,255";

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function countsForWidth(w) {
    if (w < MOBILE_BREAKPOINT) return { deep: 2200, field: 1700, logo: 1000 };
    if (w < TABLET_BREAKPOINT) return { deep: 6400, field: 4600, logo: 1700 };
    return { deep: 10200, field: 6800, logo: 3000 };
  }

  function ParticleHero(canvas) {
    this.canvas = canvas;
    var heroSection = canvas.closest(".hero");
    if (!heroSection || !canvas.getContext) return;
    this.hero = heroSection;
    this.ctx = canvas.getContext("2d", { alpha: true });
    if (!this.ctx) return;

    this.logoSrc = canvas.dataset.logoSrc || "/assets/logo.png";
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.deepParticles = [];
    this.fieldParticles = [];
    this.logoParticles = [];
    this.logoPoints = [];
    this.logoAspect = 1;
    this.mouse = { x: -9999, y: -9999, active: false };
    this.hasFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    this.rafId = null;
    this.running = false;
    this.isVisible = true;
    this.lastTime = 0;

    this.audioCtx = null;
    this.masterGain = null;
    this.lastChimeTime = 0;

    this._tick = this._tick.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onResize = this._debounce(this._handleResize.bind(this), 150);

    this._init();
  }

  ParticleHero.prototype._init = function () {
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(
        function (entries) {
          this.isVisible = entries[0].isIntersecting;
          this._updateRunning();
        }.bind(this),
        { threshold: 0.05 }
      );
      this._io.observe(this.hero);
    }

    if (this.hasFinePointer) {
      this.hero.addEventListener("mousemove", this._onPointerMove, {
        passive: true,
      });
      this.hero.addEventListener("mouseleave", this._onPointerLeave, {
        passive: true,
      });
    }

    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("resize", this._onResize, { passive: true });

    this._resizeCanvas();
    this._layoutDeepParticles();
    this._layoutFieldParticles();
    this._loadLogoPoints();
  };

  ParticleHero.prototype._resizeCanvas = function () {
    var rect = this.hero.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  ParticleHero.prototype._handleResize = function () {
    this._resizeCanvas();
    this._layoutDeepParticles();
    this._layoutFieldParticles();
    this._layoutLogoParticles();
    if (!this.running) this._renderFrame(performance.now());
  };

  // Farthest layer: smaller, dimmer, and slower than the mid-depth field
  // below, so the two together read as particles receding into the
  // distance rather than one flat plane of dots.
  ParticleHero.prototype._makeDeepParticle = function () {
    return {
      x: rand(0, this.width),
      y: rand(0, this.height),
      vx: rand(-0.02, 0.02),
      vy: rand(-0.05, -0.012),
      r: rand(0.3, 0.9),
      baseAlpha: rand(0.02, 0.12),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.25, 0.7),
      color: Math.random() < 0.85 ? WHITE : CYAN,
    };
  };

  ParticleHero.prototype._layoutDeepParticles = function () {
    var count = countsForWidth(this.width).deep;
    if (!this.deepParticles.length) {
      var initial = [];
      for (var i = 0; i < count; i++) initial.push(this._makeDeepParticle());
      this.deepParticles = initial;
      return;
    }
    if (this.deepParticles.length > count) {
      this.deepParticles.length = count;
    } else {
      while (this.deepParticles.length < count) {
        this.deepParticles.push(this._makeDeepParticle());
      }
    }
  };

  ParticleHero.prototype._makeFieldParticle = function () {
    return {
      x: rand(0, this.width),
      y: rand(0, this.height),
      vx: rand(-0.05, 0.05),
      vy: rand(-0.16, -0.04),
      r: rand(0.5, 1.7),
      baseAlpha: rand(0.06, 0.3),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.4, 1.1),
      color: Math.random() < 0.75 ? WHITE : CYAN,
    };
  };

  ParticleHero.prototype._layoutFieldParticles = function () {
    var count = countsForWidth(this.width).field;
    if (!this.fieldParticles.length) {
      var initial = [];
      for (var i = 0; i < count; i++) initial.push(this._makeFieldParticle());
      this.fieldParticles = initial;
      return;
    }
    if (this.fieldParticles.length > count) {
      this.fieldParticles.length = count;
    } else {
      while (this.fieldParticles.length < count) {
        this.fieldParticles.push(this._makeFieldParticle());
      }
    }
  };

  ParticleHero.prototype._loadLogoPoints = function () {
    var self = this;
    var img = new Image();
    img.decoding = "async";
    img.src = this.logoSrc;

    var onReady = function () {
      try {
        var sw = 130;
        var sh = Math.max(
          1,
          Math.round(sw * (img.naturalHeight / img.naturalWidth || 1))
        );
        var off = document.createElement("canvas");
        off.width = sw;
        off.height = sh;
        var octx = off.getContext("2d");
        octx.drawImage(img, 0, 0, sw, sh);
        var data = octx.getImageData(0, 0, sw, sh).data;

        var pts = [];
        for (var y = 0; y < sh; y++) {
          for (var x = 0; x < sw; x++) {
            var alpha = data[(y * sw + x) * 4 + 3];
            if (alpha > 80) pts.push({ x: x / sw, y: y / sh });
          }
        }
        // Shuffle so subsampling by breakpoint stays evenly spread
        // across the mark rather than scanline-biased.
        for (var i = pts.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = pts[i];
          pts[i] = pts[j];
          pts[j] = tmp;
        }

        self.logoAspect = sh / sw;
        self.logoPoints = pts;
        self._layoutLogoParticles();
        self._updateRunning();
        if (!self.running) self._renderFrame(performance.now());
      } catch (e) {
        /* canvas sampling unavailable (e.g. tainted canvas) — skip the logo layer */
      }
    };

    if ("decode" in img) {
      img.decode().then(onReady).catch(function () {});
    } else {
      img.onload = onReady;
    }
  };

  ParticleHero.prototype._layoutLogoParticles = function () {
    if (!this.logoPoints.length || !this.width || !this.height) return;
    var count = Math.min(
      countsForWidth(this.width).logo,
      this.logoPoints.length
    );
    var boxW = Math.min(this.width * 0.46, this.height * 0.8, 420);
    var boxH = boxW * this.logoAspect;
    var left = this.width / 2 - boxW / 2;
    var top = this.height / 2 - boxH / 2;

    var prev = this.logoParticles;
    var next = [];
    for (var i = 0; i < count; i++) {
      var pt = this.logoPoints[i];
      var tx = left + pt.x * boxW;
      var ty = top + pt.y * boxH;
      var existing = prev[i];
      next.push({
        tx: tx,
        ty: ty,
        x: existing ? existing.x : tx + rand(-50, 50),
        y: existing ? existing.y : ty + rand(-50, 50),
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        r: existing ? existing.r : rand(0.8, 1.9),
        alpha: existing ? existing.alpha : rand(0.4, 0.85),
        color: existing ? existing.color : Math.random() < 0.55 ? CYAN : WHITE,
        wAmp: existing ? existing.wAmp : rand(1.2, 3.4),
        wSpeed: existing ? existing.wSpeed : rand(0.3, 0.8),
        phase: existing ? existing.phase : rand(0, Math.PI * 2),
      });
    }
    this.logoParticles = next;
  };

  ParticleHero.prototype._onPointerMove = function (event) {
    var rect = this.hero.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
    this.mouse.active = true;
  };

  ParticleHero.prototype._onPointerLeave = function () {
    this.mouse.active = false;
  };

  ParticleHero.prototype._unlockAudio = function () {
    // Audio effects are intentionally disabled for the hero particle section.
  };

  // Audio effects are disabled for the hero particle section.
  ParticleHero.prototype._playChime = function () {
    return;
  };

  ParticleHero.prototype._onVisibilityChange = function () {
    this._updateRunning();
  };

  ParticleHero.prototype._updateRunning = function () {
    var shouldRun =
      this.isVisible &&
      document.visibilityState === "visible" &&
      !this.prefersReducedMotion;

    if (shouldRun && !this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.rafId = window.requestAnimationFrame(this._tick);
    } else if (!shouldRun && this.running) {
      this.running = false;
      if (this.rafId !== null) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  };

  ParticleHero.prototype._tick = function (time) {
    if (!this.running) return;
    this.rafId = window.requestAnimationFrame(this._tick);
    this._renderFrame(time);
  };

  // Shared drift/twinkle/wrap logic for the deep and field particle
  // layers — same behavior, different size/speed/alpha tuning per layer.
  ParticleHero.prototype._drawDriftingParticles = function (
    particles,
    w,
    h,
    time,
    animate
  ) {
    var ctx = this.ctx;
    for (var i = 0; i < particles.length; i++) {
      var f = particles[i];
      if (animate) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.y < -10) {
          f.y = h + 10;
          f.x = rand(0, w);
        }
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;
      }
      var twinkle = animate
        ? 0.7 + 0.3 * Math.sin(time * 0.0011 * f.speed + f.phase)
        : 1;
      ctx.beginPath();
      ctx.fillStyle =
        "rgba(" + f.color + "," + (f.baseAlpha * twinkle).toFixed(3) + ")";
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  ParticleHero.prototype._renderFrame = function (time) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    ctx.clearRect(0, 0, w, h);

    // Ambient field particles: slow upward drift with a soft twinkle,
    // wrapping around the hero bounds. Deep layer drawn first so the
    // mid-depth field sits visually in front of it.
    var animate = this.running; // false while reduced-motion (static frame)
    this._drawDriftingParticles(this.deepParticles, w, h, time, animate);
    this._drawDriftingParticles(this.fieldParticles, w, h, time, animate);

    // Logo particles: spring toward their sampled target position (plus a
    // gentle idle wobble), and get pushed away from the cursor when close.
    var t = time * 0.001;
    var mouse = this.mouse;
    var logo = this.logoParticles;
    var anyRepelled = false;
    for (var j = 0; j < logo.length; j++) {
      var p = logo[j];
      if (animate) {
        var targetX = p.tx + Math.sin(t * p.wSpeed + p.phase) * p.wAmp;
        var targetY =
          p.ty + Math.cos(t * p.wSpeed * 0.85 + p.phase) * p.wAmp;

        p.vx += (targetX - p.x) * SPRING;
        p.vy += (targetY - p.y) * SPRING;

        if (mouse.active) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var distSq = dx * dx + dy * dy;
          if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
            var dist = Math.sqrt(distSq) || 0.001;
            var force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            anyRepelled = true;
          }
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + p.color + "," + p.alpha + ")";
      ctx.arc(animate ? p.x : p.tx, animate ? p.y : p.ty, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (animate && anyRepelled) this._playChime();
  };

  ParticleHero.prototype._debounce = function (fn, wait) {
    var timeoutId;
    return function () {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fn, wait);
    };
  };

  ParticleHero.prototype.destroy = function () {
    this._updateRunningStop();
    if (this._io) this._io.disconnect();
    document.removeEventListener(
      "visibilitychange",
      this._onVisibilityChange
    );
    window.removeEventListener("resize", this._onResize);
    this.hero.removeEventListener("mousemove", this._onPointerMove);
    this.hero.removeEventListener("mouseleave", this._onPointerLeave);
    if (this.audioCtx) this.audioCtx.close();
  };

  ParticleHero.prototype._updateRunningStop = function () {
    this.running = false;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  function init() {
    var canvases = document.querySelectorAll(SELECTOR);
    var instances = [];
    for (var i = 0; i < canvases.length; i++) {
      instances.push(new ParticleHero(canvases[i]));
    }
    window.__particleHeroes = instances;
    return instances;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
