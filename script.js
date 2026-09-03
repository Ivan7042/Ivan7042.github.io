// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Dark mode toggle with localStorage persistence
const root = document.documentElement;
const toggleBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  if (theme) {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
  toggleBtn.querySelector("span").textContent = theme === "dark" ? "☀️" : "🌙";
}

try {
  const saved = localStorage.getItem("theme");
  if (saved) applyTheme(saved);
} catch (e) {
  // localStorage unavailable (e.g. privacy mode) — ignore, default theme applies
}

toggleBtn.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = current === "dark" || (!current && prefersDark);
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {
    // ignore
  }
});
