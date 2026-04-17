/* ============================================================
   AUTOTECH INDUSTRIAL SOLUTIONS — Main JavaScript
   Handles: AOS init, sticky nav, hamburger, counters, form
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   1. AOS (Animate on Scroll) — initialize once DOM is ready
────────────────────────────────────────────────────────────── */
AOS.init({
  duration: 700,       // Animation duration in ms
  easing:   'ease-out-cubic',
  once:     true,      // Only animate once (not every time element re-enters)
  offset:   80,        // Trigger animation 80px before element enters viewport
  disable:  window.matchMedia('(prefers-reduced-motion: reduce)').matches
});


/* ──────────────────────────────────────────────────────────────
   2. STICKY NAVIGATION — Scrolled state + top-bar offset
────────────────────────────────────────────────────────────── */
const navbar  = document.getElementById('navbar');
const topBar  = document.getElementById('top-bar');

function handleNavScroll() {
  const scrolled = window.scrollY > 80;
  navbar.classList.toggle('scrolled', scrolled);
  // Remove top-bar-visible once user scrolls past it
  if (topBar) {
    navbar.classList.toggle('top-bar-visible', !scrolled);
  }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();


/* ──────────────────────────────────────────────────────────────
   3. HAMBURGER MENU — Mobile slide-in nav toggle
────────────────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

// Toggle menu open/closed
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  // Prevent body scroll while menu is open
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close menu and handle smooth scroll without exposing hash in URL
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Smooth scroll for all internal anchor links — keeps URL clean (no #hash)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', window.location.pathname);
  });
});

// Close menu on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
});


/* ──────────────────────────────────────────────────────────────
   4. COUNTER ANIMATION — Animate stat numbers on scroll
      Visual states:
        · is-counting  → number glows orange, icon pulsa, barra de progreso
        · counted      → pop naranja → blanco + glow de borde
────────────────────────────────────────────────────────────── */

// Easing: exponencial — arranca rápido, frena al llegar al final
function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 2000; // ms — suficiente para ver el incremento
  const start    = performance.now();
  const block    = el.closest('.stat-block');

  // Estado inicial
  el.textContent = '0';
  block.classList.remove('counted');
  block.classList.add('is-counting');
  block.style.setProperty('--count-progress', '0');

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutExpo(progress);
    const current  = Math.round(eased * target);

    el.textContent = current;
    // Actualiza la variable CSS que controla la barra de progreso
    block.style.setProperty('--count-progress', eased.toFixed(4));

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Asegurar valor exacto final
      el.textContent = target;
      block.style.setProperty('--count-progress', '1');
      block.classList.remove('is-counting');
      block.classList.add('counted');
    }
  }

  requestAnimationFrame(update);
}

// Observar la sección; los contadores se activan al entrar al viewport
const whyUsSection = document.getElementById('why-us');

if (whyUsSection) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Disparar cada contador con delay escalonado para efecto en cascada
          entry.target.querySelectorAll('.stat-number').forEach((el, i) => {
            setTimeout(() => animateCounter(el), i * 150);
          });
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  counterObserver.observe(whyUsSection);
}


/* ──────────────────────────────────────────────────────────────
   5. CONTACT FORM — Async Formspree submission
      Intercepts the native submit, sends via fetch, and shows
      a success or error message without a full page reload.
────────────────────────────────────────────────────────────── */
const contactForm  = document.getElementById('contact-form');
const submitBtn    = document.getElementById('submit-btn');
const successMsg   = document.getElementById('form-success');
const errorMsg     = document.getElementById('form-error');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Block default form navigation

    // Hide any previous messages
    successMsg.hidden = true;
    errorMsg.hidden   = true;

    // Show loading state on button
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

    try {
      const response = await fetch(contactForm.action, {
        method:  'POST',
        body:    new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        // SUCCESS — show message, reset form
        successMsg.hidden = false;
        contactForm.reset();
        // Smooth scroll to success message
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // Server responded with an error
        errorMsg.hidden = false;
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {
      // Network / fetch error
      errorMsg.hidden = false;
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      // Restore button
      submitBtn.disabled  = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
}


/* ──────────────────────────────────────────────────────────────
   6. FOOTER — Auto-update copyright year
────────────────────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ──────────────────────────────────────────────────────────────
   7. ACTIVE NAV LINK — Highlight nav link for current section
      Uses IntersectionObserver to detect which section is visible
────────────────────────────────────────────────────────────── */
const sections    = document.querySelectorAll('section[id]');
const navAnchors  = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach(a => {
          a.classList.toggle(
            'active',
            a.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  {
    rootMargin: '-40% 0px -55% 0px', // Trigger near center of viewport
    threshold:  0
  }
);

sections.forEach(s => sectionObserver.observe(s));


/* ──────────────────────────────────────────────────────────────
   8. TESTIMONIALS CAROUSEL — Prev/Next + dots navigation
────────────────────────────────────────────────────────────── */
const tcTrack = document.getElementById('tc-track');
const tcPrev  = document.getElementById('tc-prev');
const tcNext  = document.getElementById('tc-next');
const tcDots  = document.querySelectorAll('#tc-dots .dot');

if (tcTrack && tcPrev && tcNext) {
  const total = tcDots.length;
  let current = 0;

  function goTo(idx) {
    current = (idx + total) % total;
    tcTrack.style.transform = `translateX(-${current * 100}%)`;
    tcDots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  tcPrev.addEventListener('click', () => goTo(current - 1));
  tcNext.addEventListener('click', () => goTo(current + 1));
  tcDots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));
}


/* ──────────────────────────────────────────────────────────────
   9. PILLARS TABS — Why Us section interactive list
────────────────────────────────────────────────────────────── */
const pillarItems  = document.querySelectorAll('.pillar-item');
const pillarPanels = document.querySelectorAll('.pillar-desc');

pillarItems.forEach(item => {
  item.addEventListener('click', () => {
    const idx = item.dataset.index;

    pillarItems.forEach(i => i.classList.remove('active'));
    pillarPanels.forEach(p => p.classList.remove('active'));

    item.classList.add('active');
    const panel = document.querySelector(`.pillar-desc[data-panel="${idx}"]`);
    if (panel) panel.classList.add('active');
  });
});
