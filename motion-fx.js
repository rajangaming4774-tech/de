/* ============================================================
   HapiWelkin — Motion (motion.dev) enhancements
   Vanilla JS, no build step. Loaded AFTER assets/vendor/motion.js,
   which exposes the global `Motion`.

   Adds (all additive, no conflict with the existing CSS/JS animations):
   1) A scroll-progress bar linked to page scroll (Motion `scroll`)
   2) Springy hover + press micro-interactions on buttons
   Fully disabled under prefers-reduced-motion.
   ============================================================ */
(function () {
  if (!window.Motion) return;
  var M = window.Motion;
  var animate = M.animate;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  /* ---------- 1) Scroll progress bar ---------- */
  var bar = document.getElementById('scrollProgress');
  if (bar && typeof M.scroll === 'function') {
    // Drive the bar directly from Motion's scroll progress (0 -> 1).
    M.scroll(function (progress, info) {
      var p = (typeof progress === 'number') ? progress
            : (info && info.y ? info.y.progress : 0);
      bar.style.transform = 'scaleX(' + p + ')';
    });
  }

  /* ---------- 2) Springy button micro-interactions ---------- */
  if (typeof animate !== 'function') return;

  var springIn  = { type: 'spring', stiffness: 380, damping: 18 };
  var springOut = { type: 'spring', stiffness: 380, damping: 24 };
  var springTap = { type: 'spring', stiffness: 700, damping: 30 };

  document.querySelectorAll('.btn').forEach(function (btn) {
    // Let Motion own `transform`; keep CSS transitions for colour/shadow only
    // (the base rule is `transition: all`, which would fight per-frame transforms).
    btn.style.transition = 'background .35s ease, box-shadow .35s ease, border-color .35s ease, color .35s ease';

    var hovering = false;

    btn.addEventListener('pointerenter', function () {
      hovering = true;
      animate(btn, { y: -3, scale: 1.045 }, springIn);
    });
    btn.addEventListener('pointerleave', function () {
      hovering = false;
      animate(btn, { y: 0, scale: 1 }, springOut);
    });
    btn.addEventListener('pointerdown', function () {
      animate(btn, { scale: 0.95 }, springTap);
    });
    btn.addEventListener('pointerup', function () {
      animate(btn, hovering ? { y: -3, scale: 1.045 } : { y: 0, scale: 1 }, springIn);
    });
  });
})();
