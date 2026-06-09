'use client';
import { useState, useEffect } from 'react';

/**
 * Fetches the current level title list from the database (via /api/progression).
 * Re-fetches on every mount so rank name changes in the DB are always reflected.
 * Returns [] while loading or if no progression is configured.
 */
export function useProgression(): string[] {
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/progression', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        if (data?.progression && Array.isArray(data.progression) && data.progression.length > 0) {
          setTitles(data.progression.map((p: { title: string }) => p.title));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return titles;
}
