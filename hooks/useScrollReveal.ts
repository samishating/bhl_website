'use client';
import { useEffect, useRef } from 'react';

/**
 * Attaches scroll-reveal behaviour to a container ref.
 * Children with [data-reveal] get:
 *   - class "reveal-in"  when scrolling DOWN into view
 *   - class "reveal-out" when scrolling UP out of view
 *   - class "revealed"   once fully settled (no transition re-fire on re-enter)
 *
 * Pass `stagger={true}` to apply cascading --reveal-i custom property.
 */
export function useScrollReveal<T extends HTMLElement>(stagger = false) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let lastY = window.scrollY;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[data-reveal]')
    );

    if (stagger) {
      items.forEach((el, i) => el.style.setProperty('--reveal-i', String(i)));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const currentY = window.scrollY;
        const scrollingDown = currentY >= lastY;
        lastY = currentY;

        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.remove('reveal-out');
            el.classList.add('reveal-in');
          } else {
            // Only spread back out when scrolling UP past the element
            if (!scrollingDown) {
              el.classList.remove('reveal-in');
              el.classList.add('reveal-out');
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stagger]);

  return ref;
}
