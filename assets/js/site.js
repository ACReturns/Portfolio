/* Don Smith — portfolio behaviour. No dependencies. */
(() => {
  "use strict";

  // ---- Edit these two when the Ancient Design Works site is live ----------
  const SITE_LINKS = {
    "adw-site": "",       // e.g. "https://ancientdesignworks.com/"
    "adw-portfolio": ""   // e.g. "https://ancientdesignworks.com/portfolio/"
  };
  // ---------------------------------------------------------------------------

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)");

  // External links -----------------------------------------------------------
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = SITE_LINKS[a.dataset.link];
    if (url) a.href = url;
  });
  document.querySelectorAll('a[href^="http"]').forEach((a) => {
    if (a.hostname !== location.hostname) { a.target = "_blank"; a.rel = "noopener"; }
  });

  // Header: border on scroll, mobile menu, active section --------------------
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  const closeMenu = () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; };
  menuBtn.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { closeMenu(); menuBtn.focus(); } });

  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => visible.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0));
      let best = null, ratio = 0;
      visible.forEach((r, id) => { if (r > ratio) { ratio = r; best = id; } });
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + best)));
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.01, 0.25, 0.5, 1] });
    sections.forEach((s) => spy.observe(s));
  }

  // Activity log from data/activity.json (written by a GitHub Action) --------
  const log = document.getElementById("activity-log");
  const stamp = document.getElementById("activity-stamp");
  fetch("data/activity.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      if (!data || !Array.isArray(data.items) || !data.items.length) return;
      log.replaceChildren(...data.items.slice(0, 6).map((it) => {
        const li = document.createElement("li");
        const t = document.createElement("time");
        t.dateTime = it.date; t.textContent = it.date;
        const repo = document.createElement(it.url ? "a" : "span");
        repo.className = "repo"; repo.textContent = it.repo;
        if (it.url) { repo.href = it.url; repo.target = "_blank"; repo.rel = "noopener"; }
        const msg = document.createElement("span");
        msg.className = "msg"; msg.textContent = it.text;
        li.append(t, repo, msg);
        return li;
      }));
      if (data.updated) { const d = new Date(data.updated); stamp.textContent = "Synced " + d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    })
    .catch(() => { /* keep the static rows */ });

  // Studio feed: CCTV cycling ------------------------------------------------
  const cams = [...document.querySelectorAll(".cam")];
  const CYCLE_MS = 2000;
  let active = null;
  let timers = [];

  const clearTimers = () => { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; };
  const frames = (cam) => [...cam.querySelectorAll("img")];
  const hydrate = (cam) => frames(cam).forEach((img) => { if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); } });
  const show = (cam, i) => {
    const fs = frames(cam);
    fs.forEach((img, j) => img.classList.toggle("on", j === i));
    cam.dataset.frame = String(i);
    cam.querySelector(".cam-name").textContent = `${cam.dataset.name} ${i + 1}`;
  };
  const glitch = (cam, ms) => {
    if (reduceMotion.matches) return;
    cam.classList.remove("glitch"); void cam.offsetWidth; cam.classList.add("glitch");
    timers.push(setTimeout(() => cam.classList.remove("glitch"), ms));
  };
  const step = (cam) => {
    const n = frames(cam).length;
    const next = ((Number(cam.dataset.frame) || 0) + 1) % n;
    if (reduceMotion.matches) { show(cam, next); return; }
    glitch(cam, 560);
    timers.push(setTimeout(() => show(cam, next), 220));
  };
  const start = (cam) => {
    if (active === cam) return;
    stop();
    active = cam;
    hydrate(cam);
    cam.classList.add("is-live");
    cam.querySelector(".cam-rec").textContent = "REC";
    glitch(cam, 600);
    timers.push(setInterval(() => step(cam), CYCLE_MS));
  };
  const stop = () => {
    clearTimers();
    if (!active) return;
    const cam = active; active = null;
    cam.classList.remove("is-live", "glitch");
    cam.querySelector(".cam-rec").textContent = "Standby";
    show(cam, 0);
  };

  cams.forEach((cam) => {
    cam.addEventListener("mouseenter", () => { if (!coarse.matches) start(cam); });
    cam.addEventListener("mouseleave", () => { if (!coarse.matches) stop(); });
    cam.addEventListener("focus", () => start(cam));
    cam.addEventListener("blur", () => { if (active === cam) stop(); });
  });

  // Touch screens: the feed most centred on screen goes live automatically.
  if ("IntersectionObserver" in window) {
    const ratios = new Map();
    const watch = new IntersectionObserver((entries) => {
      if (!coarse.matches) return;
      entries.forEach((en) => ratios.set(en.target, en.isIntersecting ? en.intersectionRatio : 0));
      let best = null, r = 0.6;
      ratios.forEach((v, cam) => { if (v >= r) { r = v; best = cam; } });
      if (best) start(best); else stop();
    }, { rootMargin: "-20% 0px -20% 0px", threshold: [0, 0.6, 0.8, 1] });
    cams.forEach((c) => watch.observe(c));
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

  // Contact form: submit in place, fall back to a normal POST ------------------
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (form && window.fetch && window.FormData) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; status.className = "form-status"; status.textContent = "Sending…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.className = "form-status ok";
        status.textContent = "Sent — thanks. I'll get back to you soon.";
      } catch {
        status.className = "form-status err";
        status.textContent = "Couldn't send. Email don_smith_2012@outlook.com instead.";
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
