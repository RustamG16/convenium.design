/* The Rustam Codex — motion and state. Everything here is optional: the page reads without it. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  function reducedMotion() { return reduce.matches; }
  if (reducedMotion()) doc.classList.add('no-motion');
  reduce.addEventListener('change', function () { doc.classList.toggle('no-motion', reduce.matches); });

  /* ---------- Index (header) ---------- */
  var index = document.getElementById('index');
  var toggle = index.querySelector('.index-toggle');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      index.classList.toggle('is-scrolled', window.scrollY > 80);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function closeIndex() { index.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', function () {
    var open = index.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  index.querySelectorAll('.index-list a').forEach(function (a) { a.addEventListener('click', closeIndex); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && index.classList.contains('is-open')) { closeIndex(); toggle.focus(); } });

  /* ---------- Videos: play only in view, never under reduced motion ---------- */
  var videos = Array.prototype.slice.call(document.querySelectorAll('.scene-video'));
  if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !reducedMotion()) {
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.3 });
    videos.forEach(function (v) { vo.observe(v); });
  }

  /* ---------- Board (illustrative) ---------- */
  var quests = Array.prototype.slice.call(document.querySelectorAll('.quest'));
  var xpNow = document.getElementById('xp-now');
  var litNow = document.getElementById('quests-lit');
  var reset = document.getElementById('board-reset');
  var KEY = 'codex-board-v1';
  var shownXp = 0;
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function render(animate) {
    var xp = 0, lit = 0, state = [];
    quests.forEach(function (q, i) {
      var on = q.getAttribute('aria-pressed') === 'true';
      q.querySelector('.quest-state').textContent = on ? 'Lit' : 'Unlit';
      if (on) { xp += Number(q.dataset.xp); lit += 1; state.push(i); }
    });
    litNow.textContent = String(lit);
    if (animate && hasGsap && !reducedMotion()) {
      var o = { v: shownXp };
      gsap.to(o, { v: xp, duration: 0.4, ease: 'power3.out', onUpdate: function () { xpNow.textContent = String(Math.round(o.v)); } });
    } else {
      xpNow.textContent = String(xp);
    }
    shownXp = xp;
    save(state);
  }
  load().forEach(function (i) { if (quests[i]) quests[i].setAttribute('aria-pressed', 'true'); });
  render(false);
  quests.forEach(function (q) {
    q.addEventListener('click', function () {
      q.setAttribute('aria-pressed', q.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render(true);
    });
  });
  reset.addEventListener('click', function () {
    quests.forEach(function (q) { q.setAttribute('aria-pressed', 'false'); });
    render(true);
  });

  /* ---------- Campaign hover frames (fine pointer, desktop) ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1280px)');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  if (fine.matches && hasGsap) {
    rows.forEach(function (row) {
      var frame = row.querySelector('.row-frame');
      var toY = gsap.quickTo(frame, 'y', { duration: 0.35, ease: 'power3.out' });
      function fx() { var g = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 72; return window.innerWidth - (frame.offsetWidth || 330) - g; }
      function enter(e) {
        if (reducedMotion() || row.classList.contains('is-hover')) return;
        gsap.set(frame, { xPercent: 0, yPercent: -50, x: fx(), y: e.clientY, scale: 0.96 });
        gsap.to(frame, { scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        row.classList.add('is-hover');
      }
      row.addEventListener('pointerenter', enter);
      row.addEventListener('pointerover', enter);
      row.addEventListener('pointermove', function (e) { if (!reducedMotion()) { toY(e.clientY); } });
      row.addEventListener('pointerleave', function () { row.classList.remove('is-hover'); });
    });
  }

  /* ---------- Scroll choreography ---------- */
  if (!hasGsap) { doc.classList.add('no-motion'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var ease = 'expo.out';

    /* hero-reveal */
    var reveal = gsap.timeline({ defaults: { ease: ease } });
    reveal
      .fromTo('.hero-poster', { scale: 1.06 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
      .to('.h1-word-inner', { clipPath: 'inset(0 0 0% 0)', duration: 0.8 }, 0.15)
      .to('.hero-lede', { opacity: 1, duration: 0.6 }, 0.45)
      .to('.hero-meta', { opacity: 1, duration: 0.6 }, 0.6);
    if (document.fonts && document.fonts.ready) { reveal.pause(); document.fonts.ready.then(function () { reveal.play(); }); }

    /* hero-handoff */
    gsap.to('.hero-poster', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.to('.hero-copy', { y: '-40vh', opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

    /* portrait-wipe */
    gsap.to('.portrait img', { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: ease, scrollTrigger: { trigger: '.portrait', start: 'top 80%', once: true } });

    /* rows-rise, board tiles */
    ScrollTrigger.batch('.row-copy, .quests li', {
      start: 'top 85%', once: true,
      onEnter: function (els) { els.forEach(function (el) { el.classList.add('is-in'); }); gsap.to(els, { opacity: 1, y: 0, duration: 0.4, ease: ease, stagger: { each: 0.06, from: 'start' }, overwrite: true, clearProps: 'transform,opacity' }); }
    });

    return function () {
      gsap.set('.hero-poster, .hero-copy, .portrait img, .row-copy, .quests li, .h1-word-inner, .hero-lede, .hero-meta', { clearProps: 'all' });
    };
  });

  /* paths-pin: sticky frame handled by CSS; the crossfade and the counter are scroll-driven */
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1025px)', function () {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.paths-frame img'));
    var counter = document.querySelector('.paths-count-now');
    var numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    var current = 0;
    function show(i) {
      if (i === current) return;
      var prev = frames[current], next = frames[i];
      current = i;
      counter.textContent = numerals[i];
      gsap.killTweensOf([prev, next]);
      gsap.set(next, { willChange: 'opacity, transform' });
      gsap.to(prev, { opacity: 0, duration: 0.8, ease: 'power2.inOut' });
      gsap.fromTo(next, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', onComplete: function () { gsap.set(next, { clearProps: 'willChange' }); } });
      frames.forEach(function (f, k) { f.classList.toggle('is-active', k === i); });
    }
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.path')).map(function (el, i) {
      return ScrollTrigger.create({
        trigger: el, start: 'top 55%', end: 'bottom 55%',
        onEnter: function () { show(i); }, onEnterBack: function () { show(i); }
      });
    });
    return function () { triggers.forEach(function (t) { t.kill(); }); gsap.set(frames, { clearProps: 'all' }); };
  });

  /* Recalculate once media has settled sizes */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
