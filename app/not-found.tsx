import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ fontSize: '8rem', fontWeight: 900, color: 'rgba(255,0,85,0.1)', position: 'absolute', zIndex: 0, userSelect: 'none' }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-rajdhani)', fontSize: '3rem', marginBottom: '1rem', position: 'relative' }}>
        LOST IN THE <span className="gradient-text">VOID</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '2.5rem', position: 'relative' }}>
        The page you are looking for has been archived or never existed in the Brotherhood archives.
      </p>
      <Link href="/" className="btn btn-primary" style={{ position: 'relative' }}>
        Return to HQ
      </Link>
    </div>
  );
}
