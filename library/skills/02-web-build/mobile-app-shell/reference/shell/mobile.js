/* Mobile app shell — tab bar state, phone-only folds, overlay awareness.
   Loaded on every width; does nothing above 767 px. Pairs with mobile.css. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 767px)');
  var bar = document.querySelector('[data-tabbar]');
  if (!bar) return;
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('a[data-tab]'));
  var targets = tabs.map(function (a) { return document.getElementById(a.getAttribute('data-tab')); }).filter(Boolean);

  /* Phone-only folds: `<details class="m-fold" open>` is open for desktop and no-JS; phones start closed. */
  function applyFolds(isPhone) {
    Array.prototype.forEach.call(document.querySelectorAll('details.m-fold'), function (d) {
      if (isPhone && !d.hasAttribute('data-user-toggled')) d.removeAttribute('open');
      if (!isPhone) d.setAttribute('open', '');
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('details.m-fold'), function (d) {
    d.addEventListener('toggle', function () { d.setAttribute('data-user-toggled', ''); });
  });
  applyFolds(phone.matches);
  phone.addEventListener ? phone.addEventListener('change', function (e) { applyFolds(e.matches); }) : phone.addListener(function (e) { applyFolds(e.matches); });

  /* Active tab = the section occupying the middle of the viewport. */
  function setActive(id) {
    tabs.forEach(function (a) {
      if (a.getAttribute('data-tab') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  function update() {
    ticking = false;
    if (!phone.matches) return;
    var mid = window.innerHeight * 0.45, best = null, bestD = Infinity;
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
      if (d < bestD) { bestD = d; best = el.id; }
    });
    if (best) setActive(best);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  /* Hide under full-screen overlays (the menu drawer). */
  var toggle = document.querySelector('[data-menu-toggle]');
  if (toggle && window.MutationObserver) {
    new MutationObserver(function () {
      document.body.classList.toggle('m-overlay-open', toggle.getAttribute('aria-expanded') === 'true');
    }).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
})();
