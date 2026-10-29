/* Runs first, from <head>, before anything paints (CSP allows only external scripts). */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* Theme: saved choice, otherwise the visitor's system setting, otherwise dark (Aurora Night). */
  var theme = "dark";
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") theme = saved;
    else if (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch (e) {
    try { if (matchMedia("(prefers-color-scheme: light)").matches) theme = "light"; } catch (e2) {}
  }
  root.setAttribute("data-theme", theme);

  /* Fail-safe: if script.js never starts (blocked, offline, error), drop the "js" class after
     4.5 s so every section is shown instead of staying invisible waiting for reveal animations. */
  setTimeout(function () {
    if (!root.classList.contains("ready")) root.classList.remove("js");
  }, 4500);
})();
