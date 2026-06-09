'use client';
import { useState, useEffect } from 'react';

let cachedTitles: string[] | null = null;
let cachePromise: Promise<string[]> | null = null;

/**
 * Fetches the current level title list from the database (via /api/progression).
 * Results are module-level cached so multiple components share one fetch per page load.
 * Returns [] if DB has no progression configured yet.
 */
async function fetchTitles(): Promise<string[]> {
  if (cachedTitles) return cachedTitles;
  if (cachePromise) return cachePromise;

  cachePromise = fetch('/api/progression', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (data?.progression && Array.isArray(data.progression) && data.progression.length > 0) {
        const titles: string[] = data.progression.map((p: { title: string }) => p.title);
        cachedTitles = titles;
        return titles;
      }
      cachedTitles = [];
      return [];
    })
    .catch(() => {
      cachedTitles = [];
      return [];
    });

  return cachePromise;
}

/**
 * Hook — returns the DB-sourced level titles array.
 * Returns [] until resolved; components should handle the empty case gracefully.
 */
export function useProgression(): string[] {
  const [titles, setTitles] = useState<string[]>(cachedTitles ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchTitles().then(t => {
      if (!cancelled) setTitles(t);
    });
    return () => { cancelled = true; };
  }, []);

  return titles;
}
