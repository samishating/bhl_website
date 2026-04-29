'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncListener() {
  const router = useRouter();
  const lastUpdatedRef = useRef<number | null>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        
        if (lastUpdatedRef.current !== null && data.lastUpdated > lastUpdatedRef.current) {
          console.log('🔄 Data update detected, refreshing...');
          router.refresh();
          window.dispatchEvent(new Event('stats-refresh'));
        }
        
        lastUpdatedRef.current = data.lastUpdated;
      } catch (err) {
        // Silently ignore polling errors
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkUpdates, 10000);
    checkUpdates(); // Initial check

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
