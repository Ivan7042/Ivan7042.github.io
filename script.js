(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored || (prefersDark ? "dark" : "light");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  applyTheme(theme);

  toggle.addEventListener("click", function () {
    var next = theme === "dark" ? "light" : "dark";
    theme = next;
    localStorage.setItem("theme", next);

    if (reduceMotion) {
      applyTheme(next);
      return;
    }

    // soft crossfade: dim the content, swap the palette underneath, restore.
    root.classList.add("theme-switching");
    window.setTimeout(function () {
      applyTheme(next);
      window.setTimeout(function () {
        root.classList.remove("theme-switching");
      }, 20);
    }, 160);
  });

  function applyTheme(t) {
    if (t === "dark") {
      root.setAttribute("data-theme", "dark");
      toggle.textContent = "[light]";
    } else {
      root.removeAttribute("data-theme");
      toggle.textContent = "[dark]";
    }
  }

  // ---------- table of contents ----------
  var tocRail = document.getElementById("toc-rail");
  var tocTab = document.getElementById("toc-tab");
  var tocPanel = document.getElementById("toc-panel");

  tocTab.addEventListener("click", function () {
    var isOpen = tocRail.classList.toggle("open");
    tocTab.setAttribute("aria-expanded", String(isOpen));
  });

  tocPanel.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      tocRail.classList.remove("open");
      tocTab.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", function (e) {
    if (!tocRail.contains(e.target)) {
      tocRail.classList.remove("open");
      tocTab.setAttribute("aria-expanded", "false");
    }
  });

  // ---------- typewriter title ----------
  if (!reduceMotion) {
    var title = document.querySelector(".doc-title");
    if (title) {
      var full = title.textContent;
      title.textContent = "";
      title.classList.add("doc-title--typing");
      var ti = 0;
      window.setTimeout(function typeNext() {
        title.textContent = full.slice(0, ti);
        ti += 1;
        if (ti <= full.length) {
          window.setTimeout(typeNext, 45);
        } else {
          title.classList.remove("doc-title--typing");
        }
      }, 450);
    }
  }

  // ---------- skills -> chips ----------
  document.querySelectorAll(".skill-list dd").forEach(function (dd) {
    var items = dd.textContent.split(",").map(function (s) {
      return s.trim();
    });
    dd.textContent = "";
    dd.classList.add("chips");
    items.forEach(function (label, i) {
      var span = document.createElement("span");
      span.className = "chip";
      span.textContent = label;
      span.style.setProperty("--i", i);
      dd.appendChild(span);
    });
  });

  // ---------- scroll reveal (sections + entries) ----------
  if (!reduceMotion && hasIO) {
    var revealTargets = [];
    document.querySelectorAll(".doc-section").forEach(function (section) {
      section.classList.add("reveal");
      revealTargets.push(section);
      section.querySelectorAll(".entry").forEach(function (entry, i) {
        entry.classList.add("reveal");
        entry.style.setProperty("--i", i);
        revealTargets.push(entry);
      });
    });

    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    revealTargets.forEach(function (el) {
      revealIO.observe(el);
    });
  }

  // ---------- count-up figures ----------
  var counters = document.querySelectorAll(".count");

  counters.forEach(function (el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    if (reduceMotion || !hasIO) {
      el.textContent = format(target);
    } else {
      el.textContent = "0";
    }
  });

  if (!reduceMotion && hasIO && counters.length) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      countIO.observe(el);
    });
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    var duration = 1100;
    var startTs = null;
    function frame(ts) {
      if (startTs === null) startTs = ts;
      var p = Math.min((ts - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function format(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ---------- table-of-contents scrollspy ----------
  var spyIds = [];
  var linkFor = {};

  tocPanel.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (document.getElementById(id)) {
      spyIds.push(id);
      linkFor[id] = a;
    }
  });

  function updateSpy() {
    if (!spyIds.length) return;
    var line = 130; // px below the viewport top
    var currentId = spyIds[0];
    spyIds.forEach(function (id) {
      if (document.getElementById(id).getBoundingClientRect().top <= line) {
        currentId = id;
      }
    });
    var atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) currentId = spyIds[spyIds.length - 1];

    spyIds.forEach(function (id) {
      linkFor[id].classList.toggle("toc-current", id === currentId);
    });
  }

  // ---------- sticky info bar + scroll-to-top ----------
  var stickyBar = document.getElementById("sticky-bar");
  var toTop = document.getElementById("to-top");
  var eduSection = document.getElementById("education");

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  function updateChrome() {
    if (eduSection && stickyBar) {
      // slide the bar in once Education has scrolled off the top; hide on the way back up
      var past = eduSection.getBoundingClientRect().bottom <= 8;
      stickyBar.classList.toggle("visible", past);
      stickyBar.setAttribute("aria-hidden", String(!past));
      document.body.classList.toggle("sticky-active", past);
    }
    if (toTop) {
      toTop.classList.toggle("visible", window.scrollY > window.innerHeight * 0.6);
    }
  }

  // ---------- one throttled scroll handler ----------
  var ticking = false;
  function onScroll() {
    updateSpy();
    updateChrome();
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(onScroll);
    },
    { passive: true }
  );

  window.addEventListener("resize", onScroll, { passive: true });

  onScroll();

  // ---------- appendix: gated behind the Konami code ----------
  var konamiSequence = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  ];
  var konamiProgress = 0;

  document.addEventListener("keydown", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiProgress = key === konamiSequence[konamiProgress] ? konamiProgress + 1 : (key === konamiSequence[0] ? 1 : 0);
    if (konamiProgress === konamiSequence.length) {
      konamiProgress = 0;
      unlockAppendix();
    }
  });

  function unlockAppendix() {
    var appendix = document.getElementById("appendix");
    if (!appendix || !appendix.hidden) return;
    appendix.hidden = false;
    var entries = appendix.querySelectorAll(".entry");
    var reveal = function () {
      appendix.classList.add("in-view");
      entries.forEach(function (entry) {
        entry.classList.add("in-view");
      });
    };
    if (reduceMotion) {
      reveal();
    } else {
      // double rAF: force a layout flush in the hidden->visible state first,
      // so the .in-view transition actually has a "from" frame to animate.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(reveal);
      });
    }
    appendix.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  // ---------- appendix: A.1 project archive search (toy SQL injection) ----------
  // Deliberately naive: builds a "query" the vulnerable way, then only checks
  // for the classic tautology pattern before deciding whether to honor the
  // WHERE clause at all. Everything here is a plain JS array, in this tab.
  var projectsDB = [
    { name: "Static IPv4 Router", tag: "C++", visible: true },
    { name: "Custom UDP-Based Networking System", tag: "C++", visible: true },
    { name: "Adaptive HTTP Proxy for Bitrate Streaming", tag: "C++", visible: true },
    { name: "Search Engine", tag: "Python", visible: true },
    { name: "Easy ABLLS-R", tag: "React", visible: true },
    { name: "[restricted] Project Chimera", tag: "classified", visible: false, flag: "flag{sql1_qu073s_4r3_n0t_35c4p3d}" },
  ];

  var sqliInput = document.getElementById("sqli-input");
  var sqliPreview = document.getElementById("sqli-query-preview");
  var sqliResults = document.getElementById("sqli-results");
  var sqliFlag = document.getElementById("sqli-flag");

  function isSqlInjection(query) {
    var stripped = query.replace(/['"]/g, "").toLowerCase();
    return /\bor\b\s*(1\s*=\s*1|true)\b/.test(stripped); // classic tautology pattern
  }

  function runSqliQuery(raw) {
    var q = raw || "";
    var query = "SELECT * FROM projects WHERE name LIKE '%" + q + "%'";
    if (sqliPreview) sqliPreview.textContent = query;

    var rows;
    if (isSqlInjection(query)) {
      rows = projectsDB; // WHERE clause bypassed entirely
    } else {
      var needle = q.toLowerCase();
      rows = projectsDB.filter(function (r) {
        return r.visible && r.name.toLowerCase().indexOf(needle) !== -1;
      });
    }

    if (sqliResults) {
      sqliResults.innerHTML = "";
      rows.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = r.name + " · " + r.tag;
        sqliResults.appendChild(li);
      });
    }

    var hit = rows.filter(function (r) { return r.flag; })[0];
    if (hit && sqliFlag) {
      sqliFlag.textContent = "unlocked: " + hit.flag;
      sqliFlag.hidden = false;
    }
  }

  if (sqliInput) {
    sqliInput.addEventListener("input", function () {
      runSqliQuery(sqliInput.value);
    });
    runSqliQuery("");
  }

  // ---------- appendix: A.2 guestbook (real, sandboxed DOM XSS) ----------
  // This one is genuinely vulnerable: raw input goes straight into innerHTML.
  // It's confined to this tab (nothing is sent or stored anywhere), so the
  // only "victim" a payload here can reach is your own page.
  var xssInput = document.getElementById("xss-input");
  var xssPost = document.getElementById("xss-post");
  var xssBoard = document.getElementById("xss-board");
  var xssFlag = document.getElementById("xss-flag");

  var nativeAlert = window.alert;
  window.alert = function (msg) {
    if (xssFlag) {
      xssFlag.textContent = "unlocked: flag{d0m_xss_via_1nn3rHTML}";
      xssFlag.hidden = false;
    }
    return nativeAlert.call(window, msg);
  };

  if (xssPost && xssInput && xssBoard) {
    xssPost.addEventListener("click", function () {
      if (!xssInput.value) return;
      var entry = document.createElement("div");
      entry.className = "ctf-board-entry";
      entry.innerHTML = xssInput.value; // intentionally unsanitized
      xssBoard.appendChild(entry);
      xssInput.value = "";
    });
  }

  // ---------- appendix: A.3 restricted files (broken access control) ----------
  // The "access control" is a single variable living in this tab. There's no
  // server to ask, so whatever decides your access here is exactly as
  // trustworthy as the browser console — which is to say, not at all.
  var bacStatus = document.getElementById("bac-status");
  var bacList = document.getElementById("bac-list");
  var bacFlag = document.getElementById("bac-flag");
  var isAdminValue = false;

  Object.defineProperty(window, "isAdmin", {
    configurable: true,
    get: function () {
      return isAdminValue;
    },
    set: function (v) {
      isAdminValue = !!v;
      renderBac();
    },
  });

  function renderBac() {
    if (bacStatus) bacStatus.textContent = String(isAdminValue);
    if (isAdminValue) {
      if (bacList) bacList.innerHTML = "<li>[unlocked] internal-notes.txt</li>";
      if (bacFlag) {
        bacFlag.textContent = "unlocked: flag{cli3nt_s1d3_ch3cks_ar3_n0_ch3ck_4t_4ll}";
        bacFlag.hidden = false;
      }
    }
  }
})();
