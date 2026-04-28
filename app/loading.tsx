import styles from './globals.css';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050505',
      zIndex: 99999
    }}>
      <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }} />
      <div style={{ 
        marginTop: '1.5rem', 
        fontFamily: 'var(--font-rajdhani)', 
        fontSize: '0.85rem', 
        letterSpacing: '3px', 
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        Initializing Legacy...
      </div>
    </div>
  );
}
