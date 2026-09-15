/**
 * ============================================================
 * Face-tracking hero — video "looks" toward the cursor
 * ============================================================
 *
 * The source video is a short clip of a face sweeping from looking
 * far-left → center → far-right. Instead of *playing* the clip, we
 * treat it as a scrubbable strip of frames: the horizontal cursor
 * position (0..1) across the *full browser width* (not just the video
 * box) maps continuously onto the video's timeline, and we seek
 * `video.currentTime` toward that target every frame, eased so motion
 * never jumps.
 *
 * Usage: <div data-face-hero ...>
 *   <div data-face-hero-media>
 *     <video data-face-hero-video>
 *       <source src="assets/videos/face-tracking-scrub.webm" ... />
 *       <source src="assets/videos/face-tracking-scrub.mov" ... />
 *     </video>
 *     <img data-face-hero-fallback ... />
 *   </div>
 * </div>
 *
 * Perf note: this relies on cheap random seeking within the clip. The
 * source files (assets/videos/face-tracking-scrub.webm and the Safari
 * .mov fallback) are encoded specifically for scrubbing — 1080p (down
 * from a 4K master) with a keyframe every 6
 * frames (~0.2s at 30fps) — so any seek is at most a few frames from a
 * keyframe instead of walking back through a multi-second GOP. If
 * scrubbing ever feels sluggish again, re-check that encoding first
 * before touching the JS below; it's the dominant cost, not the easing.
 */
(function () {
  "use strict";

  var SELECTOR = "[data-face-hero]";
  var EASING = 0.35; // interpolation factor per animation frame (0..1); short-GOP source makes seeks cheap, so we can stay closer to the cursor without the picture tearing
  var SEEK_EPSILON = 0.008; // seconds; skip redundant currentTime writes
  var MOBILE_BREAKPOINT = 600; // px; below this, tracking is disabled
  var VIDEO_LOAD_TIMEOUT = 4000; // ms; fall back to static image if exceeded

  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  function FaceTrackingHero(root) {
    this.root = root;
    this.media = root.querySelector("[data-face-hero-media]");
    this.video = root.querySelector("[data-face-hero-video]");
    this.fallback = root.querySelector("[data-face-hero-fallback]");

    if (!this.media || !this.video) return;

    this.rangeStart = clamp01(parseFloat(root.dataset.rangeStart || "0"));
    this.rangeEnd = clamp01(parseFloat(root.dataset.rangeEnd || "1"));

    this.duration = 0;
    this.targetX = 0.5;
    this.currentTime = 0;
    this.targetTime = 0;
    this.rafId = null;
    this.isReady = false;
    this.trackingEnabled = false;
    this.isPointerActive = false;
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onResize = this._debounce(this._configureMode.bind(this), 150);
    this._tick = this._tick.bind(this);
    this._onLoadedMetadata = this._onLoadedMetadata.bind(this);
    this._onVideoError = this._onVideoError.bind(this);

    this._init();
  }

  FaceTrackingHero.prototype._init = function () {
    this._isVisible = true;
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(
        function (entries) {
          this._isVisible = entries[0].isIntersecting;
        }.bind(this),
        { threshold: 0.05 }
      );
      this._io.observe(this.root);
    }

    this.video.addEventListener("loadedmetadata", this._onLoadedMetadata, {
      once: true,
    });
    this.video.addEventListener("error", this._onVideoError, { once: true });

    this._loadTimeoutId = window.setTimeout(
      this._onVideoError,
      VIDEO_LOAD_TIMEOUT
    );

    try {
      this.video.load();
    } catch (e) {
      this._onVideoError();
    }

    this._configureMode();
    window.addEventListener("resize", this._onResize);
  };

  FaceTrackingHero.prototype._onLoadedMetadata = function () {
    window.clearTimeout(this._loadTimeoutId);

    if (!this.video.duration || !isFinite(this.video.duration)) {
      this._onVideoError();
      return;
    }

    this.duration = this.video.duration;
    this.isReady = true;
    this.media.setAttribute("data-video-ready", "true");

    var centerTime = this._timeForX(0.5);
    this.currentTime = centerTime;
    this.targetTime = centerTime;
    try {
      this.video.currentTime = centerTime;
    } catch (e) {
      /* some browsers need a rAF tick before seeking is allowed */
    }

    this._startLoop();
  };

  FaceTrackingHero.prototype._onVideoError = function () {
    window.clearTimeout(this._loadTimeoutId);
    if (this.isReady) return;
    this.media.setAttribute("data-video-ready", "false");
    this._stopLoop();
  };

  FaceTrackingHero.prototype._configureMode = function () {
    this._teardownInputListeners();

    var isCoarse = window.matchMedia("(pointer: coarse)").matches;
    var isNarrow = window.innerWidth < MOBILE_BREAKPOINT;

    if (this.prefersReducedMotion || (isCoarse && isNarrow)) {
      this.trackingEnabled = false;
      this.targetX = 0.5;
      this.targetTime = this._timeForX(0.5);
      return;
    }

    this.trackingEnabled = true;

    if (isCoarse) {
      this.root.addEventListener("touchmove", this._onTouchMove, {
        passive: true,
      });
      this.root.addEventListener("touchend", this._onTouchEnd, {
        passive: true,
      });
      this.root.addEventListener("touchcancel", this._onTouchEnd, {
        passive: true,
      });
    } else {
      // Track the cursor across the whole page, not just the video box,
      // so the face reacts to mouse movement anywhere on a full-width screen.
      document.addEventListener("mousemove", this._onPointerMove, {
        passive: true,
      });
      document.documentElement.addEventListener(
        "mouseleave",
        this._onMouseLeave,
        { passive: true }
      );
    }
  };

  FaceTrackingHero.prototype._teardownInputListeners = function () {
    document.removeEventListener("mousemove", this._onPointerMove);
    document.documentElement.removeEventListener(
      "mouseleave",
      this._onMouseLeave
    );
    this.root.removeEventListener("touchmove", this._onTouchMove);
    this.root.removeEventListener("touchend", this._onTouchEnd);
    this.root.removeEventListener("touchcancel", this._onTouchEnd);
  };

  FaceTrackingHero.prototype._onMouseLeave = function () {
    this.targetX = 0.5;
    this.targetTime = this._timeForX(0.5);
  };

  FaceTrackingHero.prototype._onPointerMove = function (event) {
    this._setTargetFromClientX(event.clientX);
  };

  FaceTrackingHero.prototype._onTouchMove = function (event) {
    if (!event.touches || !event.touches.length) return;
    this.isPointerActive = true;
    this._setTargetFromClientX(event.touches[0].clientX);
  };

  FaceTrackingHero.prototype._onTouchEnd = function () {
    this.isPointerActive = false;
    this.targetX = 0.5;
    this.targetTime = this._timeForX(0.5);
  };

  FaceTrackingHero.prototype._setTargetFromClientX = function (clientX) {
    // Normalized against the full viewport width (not the video box) so
    // the face tracks the cursor across the entire screen: far left edge
    // of the browser window = 0, far right edge = 1.
    var width = document.documentElement.clientWidth || window.innerWidth;
    if (width <= 0) return;
    var normalized = clientX / width;
    this.targetX = clamp01(normalized);
    this.targetTime = this._timeForX(this.targetX);
  };

  FaceTrackingHero.prototype._timeForX = function (x) {
    if (!this.duration) return 0;
    var span = this.rangeEnd - this.rangeStart;
    // Reversed mapping: cursor at the far right (x=1) maps to the start of
    // the clip, cursor at the far left (x=0) maps to the end of the clip.
    return this.duration * (this.rangeEnd - x * span);
  };

  FaceTrackingHero.prototype._startLoop = function () {
    if (this.rafId !== null) return;
    this.rafId = window.requestAnimationFrame(this._tick);
  };

  FaceTrackingHero.prototype._stopLoop = function () {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  FaceTrackingHero.prototype._tick = function () {
    this.rafId = window.requestAnimationFrame(this._tick);

    if (!this._isVisible || !this.isReady) return;

    var delta = this.targetTime - this.currentTime;
    if (Math.abs(delta) < SEEK_EPSILON) {
      this.currentTime = this.targetTime;
    } else {
      this.currentTime += delta * EASING;
    }

    // Guard against overlapping seeks: writing currentTime while a previous
    // seek hasn't resolved yet preempts it before the decoder can paint a
    // frame, and at ~60 ticks/sec that can starve the video of ever
    // finishing a seek at all (the picture never advances — looks "stuck").
    // Skipping ticks while `seeking` is true lets each seek complete and
    // render; we still track the latest eased target above, so once the
    // browser catches up it jumps straight to the newest position instead
    // of queuing every intermediate frame.
    if (
      !this.video.seeking &&
      Math.abs(this.video.currentTime - this.currentTime) > SEEK_EPSILON &&
      this.video.readyState >= 2
    ) {
      try {
        this.video.currentTime = this.currentTime;
      } catch (e) {
        /* ignore transient seek errors (e.g. mid-seek already) */
      }
    }
  };

  FaceTrackingHero.prototype.destroy = function () {
    this._stopLoop();
    this._teardownInputListeners();
    window.removeEventListener("resize", this._onResize);
    window.clearTimeout(this._loadTimeoutId);
    if (this._io) this._io.disconnect();
    this.video.removeEventListener("loadedmetadata", this._onLoadedMetadata);
    this.video.removeEventListener("error", this._onVideoError);
  };

  FaceTrackingHero.prototype._debounce = function (fn, wait) {
    var timeoutId;
    return function () {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fn, wait);
    };
  };

  function init() {
    var roots = document.querySelectorAll(SELECTOR);
    var instances = [];
    for (var i = 0; i < roots.length; i++) {
      instances.push(new FaceTrackingHero(roots[i]));
    }
    window.__faceTrackingHeroes = instances;
    return instances;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
