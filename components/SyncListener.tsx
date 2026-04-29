'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncListener() {
  const router = useRouter();
  const lastUpdatedRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const triggerRefresh = () => {
      if (refreshTimeoutRef.current) return;

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        window.dispatchEvent(new Event('stats-refresh'));
        router.refresh();
      }, 150);
    };

    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        
        // Only trigger updates if the database timestamp has moved forward
        if (lastUpdatedRef.current !== null && data.lastUpdated > lastUpdatedRef.current) {
          // Dispatch event to update client-side components (Leaderboard, Cards)
          window.dispatchEvent(new Event('stats-refresh'));

          // Trigger Next.js router.refresh() for server-side components (Hero stats)
          if (!refreshTimeoutRef.current) {
            refreshTimeoutRef.current = setTimeout(() => {
              refreshTimeoutRef.current = null;
              router.refresh();
            }, 150);
          }
        }

        lastUpdatedRef.current = data.lastUpdated;
      } catch {
        // Ignore fallback polling errors.
      }
    };

    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('sync', triggerRefresh);

    const interval = setInterval(checkUpdates, 10000);
    checkUpdates();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      eventSource.close();
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
