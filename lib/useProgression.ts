'use client';
import { useState, useEffect } from 'react';
import { LEVEL_TITLES } from '@/lib/xp';

let cachedTitles: string[] | null = null;
let cachePromise: Promise<string[]> | null = null;

/**
 * Fetches the current level title list from the database (via /api/progression).
 * Results are module-level cached so multiple components share one fetch per page load.
 * Falls back to the hardcoded LEVEL_TITLES if the request fails.
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
      cachedTitles = LEVEL_TITLES;
      return LEVEL_TITLES;
    })
    .catch(() => {
      cachedTitles = LEVEL_TITLES;
      return LEVEL_TITLES;
    });

  return cachePromise;
}

/**
 * Hook — returns the DB-sourced level titles array.
 * Until resolved, returns the hardcoded defaults so UI never shows undefined.
 */
export function useProgression(): string[] {
  const [titles, setTitles] = useState<string[]>(cachedTitles ?? LEVEL_TITLES);

  useEffect(() => {
    let cancelled = false;
    fetchTitles().then(t => {
      if (!cancelled) setTitles(t);
    });
    return () => { cancelled = true; };
  }, []);

  return titles;
}
