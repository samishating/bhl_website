'use client';
import { useEffect, useState } from 'react';

export default function HomeFixedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -5,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        background: `
          repeating-linear-gradient(to right,
            transparent,
            transparent 99px,
            rgba(255, 0, 0, 0.03) 99px,
            rgba(255, 0, 0, 0.03) 100px
          ),
          radial-gradient(ellipse at top, rgba(30, 5, 5, 0.6) 0%, transparent 60%),
          #0a0808
        `
      }}
    />
  );
}
