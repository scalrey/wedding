/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Scroll reveal using highly performant Intersection Observer API
export function initScrollReveal(): void {
  const revealElements = document.querySelectorAll('[data-reveal]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing once element is shown successfully
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null, // Viewport
    threshold: 0.1, // Trigger when 10% of element is in view
    rootMargin: '0px 0px -50px 0px' // Offset slightly to trigger earlier/comfortably
  });

  revealElements.forEach((el) => {
    observer.observe(el);
  });
}

// Parallax scrolling for the Hero section text
export function initParallax(): void {
  const heroContent = document.querySelector('.hero-border') as HTMLElement | null;
  if (!heroContent) return;

  const mql = window.matchMedia('(prefers-reduced-motion: reduce) or (max-width: 767px)');
  
  // Disable if user prefers reduced motion or on mobile devices (<768px)
  if (mql.matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        // Move background/content slightly slower than scroll speed (0.3x coefficient)
        heroContent.style.transform = `translateY(${scrolled * 0.28}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}
