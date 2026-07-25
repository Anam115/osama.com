/**
 * Osama Anam — Portfolio Script
 * Vanilla JS IIFE: theme, navigation, animations, form handling
 */
(function () {
  "use strict";

  var THEME_KEY = "portfolio-theme";
  var TYPING_ROLES = [
    "Laravel Developer",
    "Full Stack Developer",
    "PHP Developer",
    "Software Engineer",
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initThemeToggle();
    initMobileMenu();
    initNavbarScroll();
    initSmoothScroll();
    initTypingAnimation();
    initScrollReveal();
    initSkillBars();
    initCounters();
    initButtonRipple();
    initBackToTop();
    initContactForm();
    initActiveNavOnScroll();
    initCertificateModal();
  }

  /* --------------------------------------------------------------------------
     Theme toggle — dark-first default, light via data-theme="light"
     -------------------------------------------------------------------------- */
  function initThemeToggle() {
    var toggle = document.getElementById("theme-toggle");
    var stored = localStorage.getItem(THEME_KEY);
    var initial = stored === "light" ? "light" : "dark";

    applyTheme(initial);

    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      var next = isLight ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  /* --------------------------------------------------------------------------
     Mobile menu — aria attributes, Escape to close
     -------------------------------------------------------------------------- */
  function initMobileMenu() {
    var toggle = document.getElementById("menu-toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.classList.toggle("active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      document.body.classList.toggle("menu-open", isOpen);
    });

    menu.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    function closeMenu() {
      menu.classList.remove("open");
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("menu-open");
    }
  }

  /* --------------------------------------------------------------------------
     Navbar scroll state
     -------------------------------------------------------------------------- */
  function initNavbarScroll() {
    var navbar = document.getElementById("navbar");
    if (!navbar) return;

    function update() {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* --------------------------------------------------------------------------
     Smooth scroll for in-page anchor links
     -------------------------------------------------------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        var id = this.getAttribute("href");
        if (!id || id === "#") return;

        var target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        if (history.replaceState) {
          history.replaceState(null, "", id);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     Typing animation — rotating roles (text only, no particle effects)
     -------------------------------------------------------------------------- */
  function initTypingAnimation() {
    var el = document.getElementById("typing-text");
    if (!el) return;

    var roleIndex = 0;
    var charIndex = 0;
    var deleting = false;
    var pauseUntil = 0;

    function tick(now) {
      if (now < pauseUntil) {
        requestAnimationFrame(tick);
        return;
      }

      var current = TYPING_ROLES[roleIndex];
      var delay;

      if (!deleting) {
        el.textContent = current.slice(0, charIndex + 1);
        charIndex += 1;

        if (charIndex === current.length) {
          deleting = true;
          delay = 1800;
        } else {
          delay = 90;
        }
      } else {
        el.textContent = current.slice(0, charIndex - 1);
        charIndex -= 1;

        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % TYPING_ROLES.length;
          delay = 400;
        } else {
          delay = 40;
        }
      }

      pauseUntil = now + delay;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* --------------------------------------------------------------------------
     Scroll reveal — .reveal becomes .visible
     -------------------------------------------------------------------------- */
  function initScrollReveal() {
    var elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* --------------------------------------------------------------------------
     Skill bars — animate width from data-progress
     -------------------------------------------------------------------------- */
  function initSkillBars() {
    var items = document.querySelectorAll(".skill-item[data-progress]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(animateSkillBar);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateSkillBar(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function animateSkillBar(item) {
    var fill = item.querySelector(".skill-fill");
    var progress = item.getAttribute("data-progress") || "0";
    if (fill) {
      fill.style.width = progress + "%";
    }
  }

  /* --------------------------------------------------------------------------
     Stat counters — data-target + data-suffix
     -------------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll(".stat-number");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1800;
    var start = performance.now();

    function update(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  /* --------------------------------------------------------------------------
     Button ripple on .btn click
     -------------------------------------------------------------------------- */
  function initButtonRipple() {
    if (!document.getElementById("ripple-style")) {
      var style = document.createElement("style");
      style.id = "ripple-style";
      style.textContent =
        ".btn::after{left:var(--ripple-x,50%);top:var(--ripple-y,50%);}";
      document.head.appendChild(style);
    }

    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        var rect = btn.getBoundingClientRect();
        btn.style.setProperty("--ripple-x", event.clientX - rect.left + "px");
        btn.style.setProperty("--ripple-y", event.clientY - rect.top + "px");
        btn.classList.remove("rippling");
        void btn.offsetWidth;
        btn.classList.add("rippling");

        window.setTimeout(function () {
          btn.classList.remove("rippling");
        }, 500);
      });
    });
  }

  /* --------------------------------------------------------------------------
     Back to top button
     -------------------------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;

    function update() {
      btn.classList.toggle("visible", window.scrollY > 500);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --------------------------------------------------------------------------
     Contact form — client-side validation + alert
     -------------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var subject = form.querySelector("#subject");
      var message = form.querySelector("#message");

      if (
        !name ||
        !email ||
        !subject ||
        !message ||
        !name.value.trim() ||
        !email.value.trim() ||
        !subject.value.trim() ||
        !message.value.trim()
      ) {
        alert("Please fill in all fields before sending.");
        return;
      }

      if (!isValidEmail(email.value.trim())) {
        alert("Please enter a valid email address.");
        email.focus();
        return;
      }

      alert("Thank you for your message! Please contact me via email.");
      form.reset();
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* --------------------------------------------------------------------------
     Active nav link on scroll
     -------------------------------------------------------------------------- */
  function initActiveNavOnScroll() {
    var sections = document.querySelectorAll("main section[id]");
    var links = document.querySelectorAll(".nav-link");
    if (!sections.length || !links.length) return;

    function updateActive() {
      var scrollPos = window.scrollY + 120;
      var current = "";

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          current = section.getAttribute("id");
        }
      });

      links.forEach(function (link) {
        var href = link.getAttribute("href");
        link.classList.toggle("active", href === "#" + current);
      });
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
  }

  /* --------------------------------------------------------------------------
     Certificate lightbox modal
     -------------------------------------------------------------------------- */
  function initCertificateModal() {
    var modal = document.getElementById("cert-modal");
    var img = document.getElementById("cert-modal-img");
    var title = document.getElementById("cert-modal-title");
    var triggers = document.querySelectorAll(".cert-view-btn");
    if (!modal || !img || !title || !triggers.length) return;

    function openModal(src, certTitle) {
      img.src = src;
      img.alt = certTitle || "Certificate preview";
      title.textContent = certTitle || "Certificate";
      modal.hidden = false;
      document.body.classList.add("cert-modal-open");
    }

    function closeModal() {
      modal.hidden = true;
      img.src = "";
      document.body.classList.remove("cert-modal-open");
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-cert-src"), btn.getAttribute("data-cert-title"));
      });
    });

    modal.querySelectorAll("[data-cert-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }
})();
