(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored || (prefersDark ? "dark" : "light");

  applyTheme(theme);

  toggle.addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", theme);
    applyTheme(theme);
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

  // Table of contents: hover works on desktop; tap-to-toggle covers touch.
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
})();