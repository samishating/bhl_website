'use client';
import { useEffect, useState, RefObject } from 'react';

/**
 * Tracks whether a horizontally-scrollable element is at its start/end, so a
 * swipe-hint arrow can be hidden once there's nothing left to scroll to in
 * that direction (sticky-positioning alone only repositions the arrow --
 * it never actually disappears at the true edges).
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { atStart, atEnd };
}
