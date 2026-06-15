/* The Oak Cafe — tasteful, 60fps-friendly interactions.
   Only transform & opacity are animated. rAF for all scroll work.
   prefers-reduced-motion is fully honored (we no-op the motion paths). */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Sticky condensing header (rAF-throttled scroll) ---- */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var ticking = false;
    var apply = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 40);
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
  }

  if (reduce) return; // everything below is pure motion enhancement

  /* ---- 2. Hero staggered entrance ---- */
  var heroItems = document.querySelectorAll("[data-hero]");
  heroItems.forEach(function (el) {
    var i = parseInt(el.getAttribute("data-hero"), 10) || 1;
    var delay = 0.06 + i * 0.11;
    el.style.transform = "translateY(20px)";
    el.style.transition =
      "opacity .85s cubic-bezier(.2,.7,.2,1) " + delay + "s," +
      "transform .85s cubic-bezier(.2,.7,.2,1) " + delay + "s";
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      heroItems.forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });
  });

  // hero image wipe-reveal
  var wipe = document.querySelector(".hero__reveal");
  if (wipe) {
    wipe.style.transform = "rotate(1.4deg) scaleY(1)";
    wipe.style.transformOrigin = "bottom";
    wipe.style.transition = "transform 1s cubic-bezier(.16,.84,.3,1) .35s";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wipe.style.transform = "rotate(1.4deg) scaleY(0)";
      });
    });
  }

  /* ---- 3. Scroll reveal via IntersectionObserver (fade + rise) ---- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var d = parseInt(el.getAttribute("data-reveal-delay"), 10) || 0;
        el.style.transitionDelay = (d * 0.09) + "s";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- 4. Gallery parallax (transform only, rAF, in-view only) ---- */
  var parallaxEls = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  );
  if (parallaxEls.length && window.matchMedia("(min-width: 720px)").matches) {
    var active = [];
    var pObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var img = e.target.querySelector("img");
        if (e.isIntersecting) {
          if (img) img.style.willChange = "transform";
          if (active.indexOf(e.target) === -1) active.push(e.target);
        } else {
          if (img) img.style.willChange = "auto";
          var idx = active.indexOf(e.target);
          if (idx > -1) active.splice(idx, 1);
        }
      });
    }, { threshold: 0 });
    parallaxEls.forEach(function (el) { pObserver.observe(el); });

    var pTicking = false;
    var vh = window.innerHeight;
    var updateParallax = function () {
      pTicking = false;
      for (var i = 0; i < active.length; i++) {
        var el = active[i];
        var rect = el.getBoundingClientRect();
        var amt = parseFloat(el.getAttribute("data-parallax")) || 10;
        // -1 .. 1 across viewport, eased to a gentle translate
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        var y = Math.max(-1, Math.min(1, progress)) * amt;
        // CSS composes --py (parallax translate) with the hover scale
        el.style.setProperty("--py", y.toFixed(2) + "px");
      }
    };
    var onPScroll = function () {
      if (!pTicking) { pTicking = true; requestAnimationFrame(updateParallax); }
    };
    window.addEventListener("scroll", onPScroll, { passive: true });
    window.addEventListener("resize", function () {
      vh = window.innerHeight; onPScroll();
    }, { passive: true });
    updateParallax();
  }
})();
