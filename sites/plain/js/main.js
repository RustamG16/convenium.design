/* THE RUSTAM CODEX: vanilla, no build step. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- opening ---------- */
  const open = () => {
    root.classList.add('is-ready');
    setTimeout(() => root.classList.add('is-done'), 4200);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(open, 450));
  else setTimeout(open, 450);

  /* ---------- split headings into masked words ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/( +)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^ +$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const s = document.createElement('span');
            s.textContent = p;
            s.style.setProperty('--i', i++);
            w.appendChild(s);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- reveal on view ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.rv, [data-split], .frame').forEach((el) => revealIO.observe(el));

  /* ---------- background videos play only when visible ---------- */
  const vids = $$('video[data-autoplay]');
  if (!reduce) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        else v.pause();
      });
    }, { threshold: 0.12 });
    vids.forEach((v) => vio.observe(v));
  }

  /* ---------- starfield ---------- */
  (function stars() {
    const c = $('#stars');
    if (!c || reduce) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, pts = [], visible = true;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      const n = Math.round((w * h) / 9000);
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.8,
        r: Math.random() * 1.1 + 0.2, a: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
        warm: Math.random() > 0.78
      }));
    };
    size();
    window.addEventListener('resize', size);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(c);
    let t0 = performance.now();
    const frame = (t) => {
      requestAnimationFrame(frame);
      if (!visible) return;
      const dt = (t - t0) / 1000; t0 = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        p.a += dt * p.s;
        const o = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.a));
        ctx.fillStyle = p.warm ? `rgba(227,185,90,${o})` : `rgba(237,235,221,${o * 0.8})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      });
    };
    requestAnimationFrame(frame);
  })();

  /* ---------- cursor glow (fine pointers) ---------- */
  const glow = $('#glow');
  if (glow && window.matchMedia('(pointer: fine)').matches && !reduce) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    (function loop() {
      gx += (tx - gx) * 0.1; gy += (ty - gy) * 0.1;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- scroll-driven pieces ---------- */
  const nav = $('#nav');
  const meridian = $('#meridian');
  const heroMedia = $('[data-hero]');
  const hero = $('#hero');
  const prologue = $('#prologue');
  const pStmts = $$('.stmt', prologue);
  const pCur = $('#pCur');
  const pVideo = $('.bgvideo', prologue);
  const camp = $('#campaigns');
  const cTrack = $('#cTrack');
  const cBar = $('#cBar');
  const pars = $$('[data-par]');
  const roman = ['I', 'II', 'III', 'IV'];

  let pinned = false, travel = 0, lastY = 0, ticking = false, curIdx = -1;

  function measure() {
    pinned = false;
    camp.classList.remove('is-pinned');
    camp.style.height = '';
    cTrack.style.transform = '';
    if (!reduce && innerWidth > 960 && innerHeight > 560) {
      camp.classList.add('is-pinned');
      travel = Math.max(0, cTrack.scrollWidth - innerWidth);
      camp.style.height = travel + innerHeight + 'px';
      pinned = true;
    }
    update();
  }

  function update() {
    ticking = false;
    const y = window.scrollY, vh = innerHeight;

    // meridian + nav
    const max = document.documentElement.scrollHeight - vh;
    meridian.style.transform = `scaleY(${max > 0 ? clamp(y / max) : 0})`;
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > vh * 0.6 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('hide');
    lastY = y;

    // hero parallax
    if (y < vh * 1.2 && !reduce) heroMedia.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;

    // prologue statements
    if (prologue) {
      const r = prologue.getBoundingClientRect();
      const span = r.height - vh;
      const p = clamp(-r.top / span);
      let idx = Math.min(3, Math.floor(p * 4 + 0.02));
      if (reduce) idx = -1;
      if (idx !== curIdx && idx >= 0) {
        pStmts.forEach((s, i) => { s.classList.toggle('is-on', i === idx); s.classList.toggle('is-past', i < idx); });
        pCur.textContent = roman[idx];
        curIdx = idx;
      }
      if (r.bottom > 0 && r.top < vh && pVideo && !reduce) pVideo.style.transform = `scale(${1.06 + p * 0.12})`;
    }

    // campaigns horizontal
    if (pinned) {
      const r = camp.getBoundingClientRect();
      const p = clamp(-r.top / (camp.offsetHeight - vh));
      cTrack.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
      cBar.style.transform = `scaleX(${p})`;
    }

    // parallax images
    if (!reduce) {
      pars.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = parseFloat(el.dataset.par) || 0.1;
        const off = (r.top + r.height / 2 - vh / 2) * -k;
        el.style.translate = `0 ${off.toFixed(1)}px`;
      });
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 150); });
  window.addEventListener('load', measure);
  measure();

  /* ---------- the wheel of six paths ---------- */
  (function wheel() {
    const sec = $('[data-wheel]');
    if (!sec) return;
    const nodes = $$('.node', sec);
    const spokes = $$('.spoke', sec);
    const texts = $$('.ptxt', sec);
    const worlds = $$('.paths__worlds img', sec);
    const core = $('.wheel__core', sec);
    let cur = 0, timer = null, user = false, inView = false;

    function set(i, fromUser) {
      cur = (i + nodes.length) % nodes.length;
      nodes.forEach((n, k) => { n.classList.toggle('is-on', k === cur); n.setAttribute('aria-selected', k === cur); n.tabIndex = k === cur ? 0 : -1; });
      spokes.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      texts.forEach((t, k) => t.classList.toggle('is-on', k === cur));
      worlds.forEach((w, k) => w.classList.toggle('is-on', k === cur));
      const col = getComputedStyle(nodes[cur]).getPropertyValue('--a').trim();
      sec.style.setProperty('--accent', col);
      if (fromUser) { user = true; stop(); }
    }
    function start() { if (user || reduce || timer) return; timer = setInterval(() => set(cur + 1), 6500); }
    function stop() { clearInterval(timer); timer = null; }

    nodes.forEach((n, i) => {
      n.addEventListener('click', () => set(i, true));
      n.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) set(i, true); });
      n.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + 1, true); nodes[cur].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(cur - 1, true); nodes[cur].focus(); }
      });
    });
    set(0);
    new IntersectionObserver((e) => { inView = e[0].isIntersecting; inView ? start() : stop(); }, { threshold: 0.35 }).observe(sec);

    // subtle tilt of the core
    if (core && !reduce && matchMedia('(pointer: fine)').matches) {
      sec.addEventListener('pointermove', (e) => {
        const r = sec.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        core.style.translate = `${x * -14}px ${y * -14}px`;
      }, { passive: true });
    }
  })();

  /* ---------- quest board ---------- */
  (function quests() {
    const list = $('#qlist');
    if (!list) return;
    const btns = $$('.q', list);
    const xpEl = $('#xp'), cnt = $('#qcount'), fill = $('#gaugeFill'), gauge = $('#gauge');
    const TOTAL = btns.reduce((a, b) => a + (+b.dataset.xp), 0); // 140
    let shown = 0, raf;

    function tween(to) {
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now(), d = reduce ? 1 : 900;
      (function step(t) {
        const k = clamp((t - t0) / d);
        const e = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (to - from) * e);
        xpEl.textContent = shown;
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function render() {
      const on = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      const xp = on.reduce((a, b) => a + (+b.dataset.xp), 0);
      tween(xp);
      cnt.textContent = `${on.length} / ${btns.length} quests`;
      fill.style.strokeDashoffset = 100 - (xp / TOTAL) * 100;
      gauge.classList.toggle('full', xp === TOTAL);
    }
    btns.forEach((b) => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    }));
    $('#qreset').addEventListener('click', () => { btns.forEach((b) => b.setAttribute('aria-pressed', 'false')); render(); });
    render();
  })();

  /* ---------- in-page anchors: land exactly, even with pinned sections ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: id === '#campaigns' ? y : y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();

// If a CDN image fails, hide the broken glyph so the dark frame stays clean.
document.querySelectorAll('img').forEach((img) => {
  const fail = () => img.classList.add('is-broken');
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
});
