/* ---------- Certificates: add new ones to this list ----------
   image: file inside assets/certificates/ (png, jpg, webp)
   pdf:   optional PDF copy inside assets/certificates/
   link:  optional online verification URL                       */
const CERTIFICATES = [
  { title: "Youth Employment Program", issuer: "TCS Empowers, Tata Consultancy Services", date: "3 June 2026", category: "Industry program", image: "assets/certificates/tcs-youth-employment.webp", pdf: "", link: "" },
  { title: "IoT Edge Computing and IoT Analytics", issuer: "Infosys Springboard", date: "24 July 2026", category: "IoT", image: "assets/certificates/infosys-iot-edge-analytics.webp", pdf: "", link: "" },
  { title: "Introduction to IoT", issuer: "Simplilearn SkillUP", date: "22 July 2026", category: "IoT", image: "assets/certificates/simplilearn-intro-iot.webp", pdf: "", link: "" },
  { title: "Solidity Smart Contract Programming for Ethereum Blockchain", issuer: "Infosys Springboard", date: "31 January 2026", category: "Blockchain", image: "assets/certificates/infosys-solidity-ethereum.webp", pdf: "", link: "" },
  { title: "Basics of Python", issuer: "Infosys Springboard", date: "26 September 2025", category: "Python", image: "assets/certificates/infosys-python-basics.webp", pdf: "", link: "" },
  { title: "HR Management Assessment", issuer: "LearnTube by CareerNinja", date: "31 March 2025", category: "Management", image: "assets/certificates/learntube-hr-management.webp", pdf: "", link: "" }
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* tells boot.js the script started (cancels its 4.5 s fail-safe) */
document.documentElement.classList.add("ready");

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add("in");
    revealObserver.unobserve(el);
    const d = parseFloat(el.style.getPropertyValue("--d")) || 0;
    setTimeout(() => el.classList.add("done"), (d + 1) * 1000 + 150);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

function watch(el) { revealObserver.observe(el); }

/* stagger siblings inside grids, and index tags/lists for sequenced entrance */
["#projects .project-grid", ".skill-grid", ".facts", ".stats"].forEach(sel => {
  const grid = $(sel);
  if (grid) [...grid.children].forEach((c, i) => c.style.setProperty("--d", (sel.includes("project") ? (i % 2) * 0.12 : i * 0.12) + "s"));
});
$$(".tags li, .steps li, .check li").forEach(li => {
  li.style.setProperty("--i", [...li.parentElement.children].indexOf(li));
});
$$("[data-anim]").forEach(watch);

/* ---------- Certificates ---------- */
const certsEl = $("#certs"), filtersEl = $("#filters");
const lightbox = $("#lightbox"), lbImg = $("#lbImg");
let activeFilter = "All";

function renderCerts() {
  certsEl.innerHTML = "";
  CERTIFICATES.filter(c => activeFilter === "All" || c.category === activeFilter).forEach((c, i) => {
    const card = document.createElement("article");
    card.className = "cert tilt";
    card.dataset.anim = "flip";
    card.style.setProperty("--d", (i % 3) * 0.12 + "s");

    const thumb = document.createElement("button");
    thumb.className = "cert-thumb";
    thumb.type = "button";
    thumb.setAttribute("aria-label", "View certificate: " + c.title);
    thumb.innerHTML = '<i class="fa-solid fa-award"></i>';
    const img = new Image();
    img.alt = c.title + " certificate";
    img.draggable = false;
    img.decoding = "async"; img.loading = "lazy";
    img.onload = () => thumb.replaceChildren(img);
    img.onerror = () => { thumb.disabled = true; };
    img.src = c.image;
    thumb.addEventListener("click", () => openLightbox(c));

    const body = document.createElement("div");
    body.className = "cert-body";
    const cat = document.createElement("span"); cat.className = "cat"; cat.textContent = c.category;
    const h = document.createElement("h3"); h.textContent = c.title;
    const p = document.createElement("p"); p.textContent = c.issuer;
    const dt = document.createElement("p"); dt.className = "date"; dt.textContent = "Issued " + c.date;
    body.append(cat, h, p, dt);

    const links = document.createElement("div");
    links.className = "cert-links";
    if (c.pdf) links.insertAdjacentHTML("beforeend", `<a href="assets/certificates/${encodeURI(c.pdf)}" target="_blank" rel="noopener noreferrer">View PDF</a>`);
    if (c.link) links.insertAdjacentHTML("beforeend", `<a href="${encodeURI(c.link)}" target="_blank" rel="noopener noreferrer">Verify online</a>`);
    if (links.children.length) body.append(links);

    card.append(thumb, body);
    certsEl.append(card);
    watch(card);
  });
}

function renderFilters() {
  const cats = ["All", ...new Set(CERTIFICATES.map(c => c.category))];
  if (cats.length < 3) { filtersEl.hidden = true; return; }
  filtersEl.innerHTML = "";
  cats.forEach(cat => {
    const b = document.createElement("button");
    b.className = "chip"; b.type = "button"; b.textContent = cat;
    b.setAttribute("aria-pressed", cat === activeFilter);
    b.addEventListener("click", () => { activeFilter = cat; renderFilters(); renderCerts(); });
    filtersEl.append(b);
  });
}

function openLightbox(c) { lbImg.src = c.image; lbImg.alt = c.title; lightbox.hidden = false; $("#lbClose").focus(); }
function closeLightbox() { lightbox.hidden = true; lbImg.removeAttribute("src"); }
lightbox.addEventListener("click", e => { if (e.target !== lbImg) closeLightbox(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !lightbox.hidden) closeLightbox(); });
renderFilters();
renderCerts();

/* ---------- Copy email ---------- */
const toast = $("#toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
$$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); showToast("Email copied: " + b.dataset.copy); }
  catch { showToast("Copy failed. Email: " + b.dataset.copy); }
}));

/* ---------- Typing effect ---------- */
const roles = ["software engineer"];
const typed = $("#typed");
let r = 0, ch = 0, deleting = false;
function type() {
  const word = roles[r];
  typed.textContent = word.slice(0, ch);
  if (!deleting && ch === word.length) {
    if (roles.length === 1) return;            /* single role: type it once and keep it */
    deleting = true; return setTimeout(type, 1500);
  }
  if (deleting && ch === 0) { deleting = false; r = (r + 1) % roles.length; }
  ch += deleting ? -1 : 1;
  setTimeout(type, deleting ? 40 : 80);
}
if (reduceMotion) typed.textContent = roles[0]; else type();

/* ---------- Count-up stats ---------- */
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count;
    if (reduceMotion) el.textContent = end;
    else { let n = 0; const t = setInterval(() => { el.textContent = ++n; if (n >= end) clearInterval(t); }, 900 / end); }
    countObserver.unobserve(el);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach(el => countObserver.observe(el));

/* ---------- Theme toggle (injected, so the HTML structure stays the same) ---------- */
(function () {
  const root = document.documentElement, right = $(".nav-right");
  if (!right) return;
  const btn = document.createElement("button");
  btn.className = "theme-toggle"; btn.id = "themeToggle"; btn.type = "button";
  right.insertBefore(btn, $("#burger"));
  const paint = () => {
    const dark = root.getAttribute("data-theme") !== "light";
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    btn.title = dark ? "Light theme" : "Dark theme";
    btn.innerHTML = '<i class="fa-solid ' + (dark ? "fa-sun" : "fa-moon") + '" aria-hidden="true"></i>';
  };
  paint();
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paint();
  });
  /* follow the system setting until the visitor picks a theme themselves */
  try {
    matchMedia("(prefers-color-scheme: light)").addEventListener("change", e => {
      let saved = null;
      try { saved = localStorage.getItem("theme"); } catch (x) {}
      if (saved) return;
      root.setAttribute("data-theme", e.matches ? "light" : "dark");
      paint();
    });
  } catch (e) {}
})();

/* ---------- Menu, active link, progress, back to top ---------- */
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const hero = $("#home");
const root = document.documentElement;
const burger = $("#burger"), menu = $("#menu");
function setMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.firstElementChild.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}
burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
$$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));

const navLinks = $$("a", menu);
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach(s => sectionObserver.observe(s));

/* back-to-top: shown once the hero has scrolled out of view (observer, no scroll listener) */
const toTop = $("#toTop");
new IntersectionObserver(es => toTop.classList.toggle("show", !es[0].isIntersecting)).observe(hero);
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

/* Scroll-linked effects (progress bar, hero parallax fade) are desktop-only.
   On touch screens nothing runs on scroll, which keeps finger scrolling smooth. */
if (fine) {
  const bar = $("#progress");
  let max = 1, ticking = false;
  const measureMax = () => { max = Math.max(1, root.scrollHeight - root.clientHeight); };
  measureMax();
  addEventListener("resize", measureMax);
  if ("ResizeObserver" in window) new ResizeObserver(measureMax).observe(document.body);
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    bar.style.transform = "scaleX(" + Math.min(1, y / max).toFixed(4) + ")";
    if (!reduceMotion && y < 1400) hero.style.setProperty("--sy", Math.round(y));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
}

/* ---------- Visitor protections ----------
   Right-click is disabled on the whole page, and dragging images/links is blocked. */
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => { if (e.target.closest("img, a, .cert-thumb")) e.preventDefault(); });
$$('a[target="_blank"]').forEach(a => a.rel = "noopener noreferrer");

$("#year").textContent = new Date().getFullYear();

/* ================= desktop-only interactions (mouse) =================
   3D tilt + cursor spotlight on cards, magnetic buttons, hero parallax.
   Nothing here is attached on touch screens. Work is batched into one
   requestAnimationFrame per pointer move. */
$$(".project, .skill, .fact, .stat").forEach(el => el.classList.add("tilt"));
$(".contact-card").classList.add("tilt");

if (fine) {
  let tiltEl = null, magEl = null, pending = null, raf = 0, hvEl = null;
  const HOLD = 16; /* px of grace around a hovered card, bigger than the lift, so the card cannot flicker at its edge */
  const setHv = el => { if (el === hvEl) return; if (hvEl) hvEl.classList.remove("hv"); hvEl = el; if (el) el.classList.add("hv"); };
  const resetTilt = () => {
    if (!tiltEl) return;
    tiltEl.classList.remove("tilting");
    tiltEl.style.setProperty("--rx", "0deg");
    tiltEl.style.setProperty("--ry", "0deg");
    tiltEl = null;
  };
  const resetMag = () => {
    if (!magEl) return;
    magEl.style.removeProperty("--tx"); magEl.style.removeProperty("--ty");
    magEl = null;
  };
  const resetHero = () => { hero.style.setProperty("--px", 0); hero.style.setProperty("--py", 0); };

  const handle = () => {
    raf = 0;
    const e = pending; if (!e) return;
    let el = e.target.closest ? e.target.closest(".tilt") : null;
    if (!el && hvEl) {
      const hb = hvEl.getBoundingClientRect();
      if (e.clientX >= hb.left - HOLD && e.clientX <= hb.right + HOLD && e.clientY >= hb.top - HOLD && e.clientY <= hb.bottom + HOLD) el = hvEl;
    }
    setHv(el);
    if (el !== tiltEl) resetTilt();
    if (el) {
      const b = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(b.width, e.clientX - b.left)), y = Math.max(0, Math.min(b.height, e.clientY - b.top));
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");
      if (!reduceMotion && !el.classList.contains("open")) {
        const max = b.width > 700 ? 2 : 6;
        el.style.setProperty("--ry", ((x / b.width - 0.5) * 2 * max).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - y / b.height) * 2 * max).toFixed(2) + "deg");
        el.classList.add("tilting");
        tiltEl = el;
      }
    }
    if (reduceMotion) return;
    const btn = e.target.closest(".btn");
    if (btn !== magEl) resetMag();
    if (btn) {
      const b = btn.getBoundingClientRect();
      btn.style.setProperty("--tx", ((e.clientX - b.left - b.width / 2) * 0.18).toFixed(1) + "px");
      btn.style.setProperty("--ty", ((e.clientY - b.top - b.height / 2) * 0.28).toFixed(1) + "px");
      magEl = btn;
    }
    if (hero.contains(e.target)) {
      const b = hero.getBoundingClientRect();
      hero.style.setProperty("--px", ((e.clientX - b.left) / b.width - 0.5).toFixed(3));
      hero.style.setProperty("--py", ((e.clientY - b.top) / b.height - 0.5).toFixed(3));
    } else resetHero();
  };
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    pending = e;
    if (!raf) raf = requestAnimationFrame(handle);
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { pending = null; setHv(null); resetTilt(); resetMag(); resetHero(); });
}

/* section headings: split into words for the masked rise */
function splitWords(node, c) {
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p => {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.append(" "); return; }
        const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true"); w.style.setProperty("--w", c.i++);
        const wi = document.createElement("span"); wi.className = "wi"; wi.textContent = p;
        w.append(wi); frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) splitWords(n, c);
  });
}
if (!reduceMotion) $$(".sec-head h2").forEach(h => { h.setAttribute("aria-label", h.textContent.trim()); splitWords(h, { i: 0 }); });

/* resume rows reveal one after another */
$$("#doc-summary .doc-row").forEach((row, i) => { row.dataset.anim = "up"; row.style.setProperty("--d", i * 0.1 + "s"); watch(row); });

/* section dot navigator (desktop) */
(function () {
  const secs = [["home", "Home"], ["about", "About"], ["skills", "Skills"], ["projects", "Projects"], ["resume", "Resume"], ["certificates", "Certificates"], ["contact", "Contact"]];
  const nav = document.createElement("nav");
  nav.className = "dots"; nav.setAttribute("aria-label", "Sections");
  nav.innerHTML = secs.map(([id, l]) => `<a href="#${id}" data-label="${l}" aria-label="${l}"></a>`).join("");
  document.body.append(nav);
  const dots = $$("a", nav);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) dots.forEach(d => d.classList.toggle("active", d.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach(([id]) => io.observe(document.getElementById(id)));
})();

/* draggable 3D cube: auto-spins, drag to rotate, keeps momentum.
   Only runs while the hero is on screen. On touch it uses touch-action: pan-y,
   so a finger that starts on the cube still scrolls the page vertically. */
(function () {
  const box = $("#cube"), cube = $(".cube-in");
  let ry = 30, rx = -20, vy = 0.45, vx = 0.12, drag = false, lx = 0, ly = 0, running = false;
  const apply = () => { cube.style.setProperty("--cy", ry.toFixed(2) + "deg"); cube.style.setProperty("--cx", rx.toFixed(2) + "deg"); };
  apply();
  if (reduceMotion) return;
  box.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; ly = e.clientY; box.setPointerCapture(e.pointerId); });
  box.addEventListener("pointermove", e => {
    if (!drag) return;
    vy = (e.clientX - lx) * 0.5; vx = -(e.clientY - ly) * 0.5;
    ry += vy; rx += vx; lx = e.clientX; ly = e.clientY; apply();
  });
  ["pointerup", "pointercancel"].forEach(t => box.addEventListener(t, () => { drag = false; }));
  function tick() {
    if (!running) return;
    if (!drag) {
      ry += vy; rx += vx;
      vy += (0.45 - vy) * 0.02; vx += (0.12 - vx) * 0.02;
      apply();
    }
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(es => {
    const vis = es[0].isIntersecting;
    if (vis && !running) { running = true; requestAnimationFrame(tick); }
    else if (!vis) running = false;
  }).observe(hero);
})();

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

/* tap or click anywhere on a project card to open its full page (links and buttons keep their own action) */
$$(".project").forEach(card => {
  const link = $('a[href^="project-"]', card);
  if (!link) return;
  card.classList.add("clickable");
  card.addEventListener("click", e => {
    if (e.target.closest("a, button")) return;
    if (String(getSelection()).length) return;
    location.href = link.getAttribute("href");
  });
});
