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
          linear-gradient(to right, 
            transparent 10%, 
            rgba(255, 0, 0, 0.03) 10.1%, 
            transparent 10.2%, 
            transparent 30%, 
            rgba(255, 0, 0, 0.02) 30.1%, 
            transparent 30.2%, 
            transparent 50%, 
            rgba(255, 0, 0, 0.05) 50.1%, 
            transparent 50.2%, 
            transparent 70%, 
            rgba(255, 0, 0, 0.02) 70.1%, 
            transparent 70.2%, 
            transparent 90%, 
            rgba(255, 0, 0, 0.03) 90.1%, 
            transparent 90.2%
          ),
          radial-gradient(ellipse at top, rgba(30, 5, 5, 0.6) 0%, transparent 60%),
          #0a0808
        `
      }}
    />
  );
}
