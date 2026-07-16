/* ============================================================
   HapiWelkin Creative Institute — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Sticky Header ----------
  const header = document.querySelector('.header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    });
  }

  // ---------- Mobile Hamburger Menu ----------
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('mobile-open');
      document.body.style.overflow = nav.classList.contains('mobile-open') ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('a:not(.nav-dropdown > a)').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('mobile-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Scroll Reveal Animations ----------
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger delay based on element's position among siblings
          const siblings = entry.target.parentElement.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
          let delay = 0;
          siblings.forEach((sib, i) => {
            if (sib === entry.target) delay = i * 100;
          });
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, Math.min(delay, 400));
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ---------- Counter Animation ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'));
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          const duration = 2000;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            el.textContent = prefix + current.toLocaleString() + suffix;
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }
          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // ---------- Testimonials Carousel ----------
  const carouselTrack = document.querySelector('.testimonials-track');
  const carouselDots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  if (carouselTrack) {
    let currentSlide = 0;
    const cards = carouselTrack.querySelectorAll('.testimonial-card');
    let cardsPerView = window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
    const totalSlides = Math.ceil(cards.length / cardsPerView);

    function updateCarousel() {
      cardsPerView = window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
      const cardWidth = cards[0] ? cards[0].offsetWidth + 30 : 0; // 30 = gap
      carouselTrack.style.transform = `translateX(-${currentSlide * cardWidth * cardsPerView}px)`;

      carouselDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const maxSlide = Math.max(0, cards.length - cardsPerView);
        currentSlide = Math.min(currentSlide + 1, maxSlide);
        updateCarousel();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = Math.max(currentSlide - 1, 0);
        updateCarousel();
      });
    }

    carouselDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        currentSlide = i;
        updateCarousel();
      });
    });

    // Autoplay
    let autoplay = setInterval(() => {
      const maxSlide = Math.max(0, cards.length - cardsPerView);
      currentSlide = currentSlide >= maxSlide ? 0 : currentSlide + 1;
      updateCarousel();
    }, 5000);

    carouselTrack.closest('.testimonials-carousel')?.addEventListener('mouseenter', () => {
      clearInterval(autoplay);
    });

    carouselTrack.closest('.testimonials-carousel')?.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => {
        const maxSlide = Math.max(0, cards.length - cardsPerView);
        currentSlide = currentSlide >= maxSlide ? 0 : currentSlide + 1;
        updateCarousel();
      }, 5000);
    });

    window.addEventListener('resize', updateCarousel);
  }

  // ---------- Enquiry Modal ----------
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalClose = document.querySelector('.modal-close');
  const enquireButtons = document.querySelectorAll('[data-modal="enquiry"]');

  function openModal(program) {
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Pre-select program if provided
      if (program) {
        const programSelect = modalOverlay.querySelector('select[name="program"]');
        if (programSelect) {
          programSelect.value = program;
        }
      }
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  enquireButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const program = btn.getAttribute('data-program') || '';
      openModal(program);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Close modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ---------- Form Handling ----------
  const forms = document.querySelectorAll('form[data-form]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ff4444';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      // Email validation
      const emailField = form.querySelector('input[type="email"]');
      if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
          emailField.style.borderColor = '#ff4444';
          valid = false;
        }
      }

      // Phone validation
      const phoneField = form.querySelector('input[type="tel"]');
      if (phoneField && phoneField.value) {
        const phoneRegex = /^[\d\s\+\-()]{8,15}$/;
        if (!phoneRegex.test(phoneField.value)) {
          phoneField.style.borderColor = '#ff4444';
          valid = false;
        }
      }

      if (!valid) return;

      // Show success
      const formContent = form.querySelector('.form-content');
      const formSuccess = form.querySelector('.form-success');

      if (formContent && formSuccess) {
        formContent.style.display = 'none';
        formSuccess.classList.add('show');
        formSuccess.style.display = 'block';
      } else {
        // For inline forms — show alert
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          const origText = btn.textContent;
          btn.textContent = '✓ Submitted!';
          btn.style.background = '#10B981';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = origText;
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
          }, 3000);
        }
      }
    });

    // Remove red border on focus
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('focus', () => {
        field.style.borderColor = '';
      });
    });
  });

  // ---------- Gallery Filter ----------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = '';
          item.style.animation = 'slideIn 0.4s ease forwards';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ---------- Gallery Lightbox ----------
  const lightbox = document.querySelector('.lightbox');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxContent = document.querySelector('.lightbox-content');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      if (lightbox && lightboxContent) {
        const title = item.getAttribute('data-title') || 'Gallery Image';
        const emoji = item.querySelector('.gallery-placeholder span')?.textContent || '🎨';
        lightboxContent.innerHTML = `
          <div class="gallery-placeholder" style="width:600px;height:400px;border-radius:20px;font-size:18px;max-width:90vw;">
            <span style="font-size:4rem;">${emoji}</span>
            <p style="font-size:16px;font-weight:600;color:var(--text-heading);">${title}</p>
          </div>
        `;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ---------- Smooth Scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Active Nav Link ----------
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .nav .dropdown-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Parallax Blobs ----------
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length > 0 && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      blobs.forEach((blob, i) => {
        const speed = 0.05 + (i * 0.02);
        blob.style.transform = `translateY(${scrollY * speed}px)`;
      });
    });
  }
});

/* ============================================================
   HERO MOVING ANIMATIONS (appended)
   1) Warm Aurora — desktop pointer parallax on the background field
   2) Kinetic headline — cycling word rotator + highlighter underline
   Both are self-contained, guarded for reduced-motion / touch, and never
   touch .blob transforms, so they compose with the existing hero motion.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- 1) Aurora background pointer parallax (desktop only) ---------- */
  (function () {
    var hero = document.getElementById('hero');
    if (!hero) return;
    var aurora = hero.querySelector('.hero-aurora');
    if (!aurora) return;

    var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    var fineMQ   = window.matchMedia('(pointer: fine)');
    if (reduceMQ.matches || !fineMQ.matches) return;

    var RANGE = 32, EASE = 0.08;
    var tx = 0, ty = 0, cx = 0, cy = 0;
    var rafId = null, running = false, active = false;

    function onMove(e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width  - 0.5;
      var ny = (e.clientY - r.top)  / r.height - 0.5;
      tx = -nx * RANGE;
      ty = -ny * RANGE;
      active = true;
      start();
    }
    function onLeave() { tx = 0; ty = 0; active = false; start(); }

    function tick() {
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
      aurora.style.setProperty('--aurora-x', cx.toFixed(2) + 'px');
      aurora.style.setProperty('--aurora-y', cy.toFixed(2) + 'px');
      if (active || Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }
    function start() { if (!running) { running = true; rafId = requestAnimationFrame(tick); } }

    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave, { passive: true });

    var onPref = function (ev) {
      if (!ev.matches) return;
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
      aurora.style.removeProperty('--aurora-x');
      aurora.style.removeProperty('--aurora-y');
    };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onPref);
    else if (reduceMQ.addListener) reduceMQ.addListener(onPref);
  })();

  /* ---------- 2) Kinetic headline word rotator ---------- */
  (function () {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;

    var rotator = hero.querySelector('.highlight');
    if (!rotator) return;
    var words = Array.prototype.slice.call(rotator.querySelectorAll('.hl-word'));
    if (words.length < 2) return;

    var index = 0, widths = [], timer = null, armed = false;

    function measure() {
      widths = words.map(function (w) { return Math.ceil(w.getBoundingClientRect().width); });
      rotator.style.width = widths[index] + 'px';
    }
    function heroVisible() {
      var r = hero.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || 0);
    }
    function tick() {
      var prev = words[index];
      index = (index + 1) % words.length;
      var next = words[index];

      prev.classList.remove('is-current');
      prev.classList.add('is-prev');

      next.classList.remove('is-prev', 'is-current');
      next.style.transition = 'none';
      void next.offsetWidth;
      next.style.transition = '';
      next.classList.add('is-current');

      rotator.style.width = widths[index] + 'px';
    }
    function start() {
      if (!armed || timer || !heroVisible()) return;
      timer = setInterval(tick, 2900);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function boot() {
      measure();
      setTimeout(function () { rotator.classList.add('is-swept'); }, 1500);
      setTimeout(function () { armed = true; start(); }, 2900);
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.15 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    var raf = null;
    window.addEventListener('resize', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; measure(); });
    });
    var onReduce = function (e) {
      if (!e.matches) return;
      stop();
      words.forEach(function (w, i) {
        w.classList.remove('is-prev');
        w.classList.toggle('is-current', i === 0);
      });
      index = 0;
      rotator.style.width = '';
    };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
    else if (reduce.addListener) reduce.addListener(onReduce);
  })();

});
