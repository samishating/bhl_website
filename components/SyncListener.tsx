'use client';
import { useEffect, useRef } from 'react';

const REFRESH_INTERVAL_MS = 30_000; // Forced 30-second refresh

export default function SyncListener() {
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dispatchRefresh = () => {
      window.dispatchEvent(new Event('stats-refresh'));
    };

    // Debounced version for SSE realtime events (avoid double-fires in rapid succession)
    const triggerRefresh = () => {
      if (refreshTimeoutRef.current) return;
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        dispatchRefresh();
      }, 150);
    };

    // SSE realtime channel — immediate event-driven refresh
    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('sync', triggerRefresh);

    // Forced 30-second interval — always fires regardless of data changes
    const interval = setInterval(dispatchRefresh, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  return null;
}
