'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: '#050505',
      padding: '2rem'
    }}>
      <h1 style={{ fontFamily: 'var(--font-rajdhani)', fontSize: '3rem', marginBottom: '1rem' }}>
        SYSTEM <span className="gradient-text">CRITICAL</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '2.5rem' }}>
        An unexpected error occurred in the core matrix. Our engineers have been notified.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
          Go Home
        </button>
        <button className="btn btn-primary" onClick={() => reset()}>
          Retry Matrix
        </button>
      </div>
    </div>
  );
}
