/* Project pages: theme toggle and year (index page has its own script.js) */
(function () {
  document.documentElement.classList.add("ready");
  var root = document.documentElement, right = document.querySelector(".nav-right");
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  if (!right) return;
  var btn = document.createElement("button");
  btn.className = "theme-toggle"; btn.type = "button";
  right.appendChild(btn);
  function paint() {
    var dark = root.getAttribute("data-theme") !== "light";
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    btn.innerHTML = '<i class="fa-solid ' + (dark ? "fa-sun" : "fa-moon") + '" aria-hidden="true"></i>';
  }
  paint();
  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paint();
  });
})();

document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
document.addEventListener("dragstart", function (e) { if (e.target.closest("img, a")) e.preventDefault(); });

const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* desktop cursor: soft ember glow, ring and dot (transform only, no layout reads) */
(function () {
  if (!fine || reduceMotion) return;
  const glow = document.createElement("div"); glow.className = "cursor-glow";
  const ring = document.createElement("div"); ring.className = "cursor-ring";
  const dot = document.createElement("div"); dot.className = "cursor-dot";
  [glow, ring, dot].forEach(n => n.setAttribute("aria-hidden", "true"));
  document.body.append(glow, ring, dot);
  let mx = -9999, my = -9999, rx = 0, ry = 0, sc = 1, hot = false, down = false, seen = false, running = false;
  const show = on => [glow, ring, dot].forEach(n => n.classList.toggle("on", on));
  const frame = () => {
    rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
    const target = down ? 0.7 : hot ? 1.9 : 1;
    sc += (target - sc) * 0.2;
    const cl = v => Math.max(-55, Math.min(55, v));
    ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) perspective(260px) rotateX(${cl(-(my - ry) * 0.9).toFixed(1)}deg) rotateY(${cl((mx - rx) * 0.9).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    glow.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1 || Math.abs(target - sc) > 0.003) requestAnimationFrame(frame);
    else running = false;
  };
  const go = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    const h = !!e.target.closest("a, button, .tilt, .chip, [role=tab], .cube");
    if (h !== hot) { hot = h; ring.classList.toggle("hot", h); }
    if (!seen) { seen = true; rx = mx; ry = my; show(true); }
    go();
  }, { passive: true });
  document.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") { down = true; go(); } });
  document.addEventListener("pointerup", () => { down = false; go(); });
  document.documentElement.addEventListener("mouseleave", () => { show(false); seen = false; });
})();

