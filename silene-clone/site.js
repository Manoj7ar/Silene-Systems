(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ——— Mobile nav ——— */
  var toggle = document.getElementById("site-nav-toggle");
  var overlay = document.getElementById("site-nav-overlay");

  function isOpen() {
    return overlay && !overlay.classList.contains("opacity-0");
  }

  function openNav() {
    if (!overlay || !toggle) return;
    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    if (!overlay || !toggle) return;
    overlay.classList.add("opacity-0", "pointer-events-none");
    overlay.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }

  if (toggle && overlay) {
    toggle.addEventListener("click", function () {
      if (isOpen()) closeNav();
      else openNav();
    });

    overlay.querySelectorAll("a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function () {
        closeNav();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 640px)").matches) closeNav();
    });
  }

  /* ——— Motion (Framer-like scroll + hero stagger) ——— */
  function initMotion() {
    if (prefersReduced) return;

    var header = document.querySelector("body > div.min-h-screen > header");
    if (header) {
      header.id = "site-header";
      header.classList.add("motion-ui-in");
    }
    if (toggle) toggle.classList.add("motion-ui-in");

    function showUiChrome() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (header) header.classList.add("is-inview");
          if (toggle) toggle.classList.add("is-inview");
        });
      });
    }

    var hero = document.getElementById("hero");
    if (hero) {
      var videoCol = hero.firstElementChild;
      if (videoCol && videoCol.classList.contains("absolute")) {
        videoCol.classList.add("hero-video-col");
      }

      var inner = hero.querySelector(".relative.z-10");
      if (inner) {
        var logo = inner.querySelector('img[src="/logo_dark.svg"]');
        var block = inner.querySelector(".flex.max-w-2xl");
        var h1 = block && block.querySelector("h1");
        var sub = block && block.querySelector("p");
        var cta =
          inner.querySelector('a[href*="/get-started"]') ||
          inner.querySelector('a[href*="app.silene"]');
        var heroEls = [logo, h1, sub, cta].filter(Boolean);
        heroEls.forEach(function (el, i) {
          el.classList.add("motion-reveal", "motion-hero-" + i);
        });

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (videoCol) videoCol.classList.add("is-inview");
            heroEls.forEach(function (el) {
              el.classList.add("is-inview");
            });
            showUiChrome();
          });
        });
      } else {
        showUiChrome();
      }
    } else {
      showUiChrome();
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var t = entry.target;

          if (t.classList.contains("js-count-row")) {
            runCountUp(t);
          }

          t.classList.add("is-inview");
          io.unobserve(t);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    function observeEach(nodes, cls) {
      nodes.forEach(function (el) {
        el.classList.add(cls);
        io.observe(el);
      });
    }

    var platform = document.getElementById("platform");
    if (platform) {
      var p6 = platform.querySelector(".max-w-6xl");
      if (p6) {
        observeEach(p6.querySelectorAll(":scope > p, :scope > h2"), "motion-reveal-sm");
        var grid = platform.querySelector(".mt-14.grid");
        if (grid) {
          grid.classList.add("motion-reveal-lg");
          io.observe(grid);
        }
      }
    }

    var useCases = document.getElementById("use-cases");
    if (useCases) {
      var u6 = useCases.querySelector(".max-w-6xl");
      if (u6) {
        observeEach(u6.querySelectorAll(":scope > p, :scope > h2"), "motion-reveal-sm");
      }
      var ug = useCases.querySelector(".mt-10.grid");
      if (ug) {
        ug.querySelectorAll(":scope > div").forEach(function (cell, i) {
          cell.classList.add("motion-reveal-sm");
          cell.style.transitionDelay = 0.06 * i + "s";
          io.observe(cell);
        });
      }
    }

    var diseases = document.getElementById("supported-diseases");
    if (diseases) {
      var d6 = diseases.querySelector(".max-w-6xl");
      if (d6) {
        observeEach(d6.querySelectorAll(":scope > p, :scope > h2"), "motion-reveal-sm");
      }
      var statsRow = diseases.querySelector(".mb-12.flex");
      if (statsRow) {
        statsRow.classList.add("motion-reveal-sm", "js-count-row");
        io.observe(statsRow);
      }
      var dgrid = statsRow && statsRow.nextElementSibling;
      if (dgrid && dgrid.classList && dgrid.classList.contains("grid")) {
        dgrid.classList.add("motion-reveal-lg");
        io.observe(dgrid);
      }
    }

    var footer = document.querySelector("footer");
    if (footer) {
      var cols = footer.querySelectorAll(".grid > div");
      cols.forEach(function (col, i) {
        col.classList.add("motion-reveal-sm");
        col.style.transitionDelay = 0.07 * i + "s";
        io.observe(col);
      });
      var footBar = footer.querySelector(".mt-12.flex");
      if (footBar) {
        footBar.classList.add("motion-reveal-sm");
        io.observe(footBar);
      }
    }
  }

  function runCountUp(row) {
    var targets = row.querySelectorAll(".text-center > p > span");
    targets.forEach(function (span) {
      var raw = (span.textContent || "").replace(/[^\d]/g, "");
      var n = parseInt(raw, 10);
      if (!n || n < 0) return;
      span.textContent = "0";
      var start = performance.now();
      var dur = 1000;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        span.textContent = String(Math.round(n * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMotion);
  } else {
    initMotion();
  }
})();
