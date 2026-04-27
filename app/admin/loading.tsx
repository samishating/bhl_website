export default function AdminLoading() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '60vh', 
      gap: '1rem' 
    }}>
      <div className="spinner" style={{ width: '40px', height: '40px' }} />
      <p style={{ 
        fontFamily: 'Rajdhani', 
        fontWeight: 600, 
        color: 'var(--text-muted)', 
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        Accessing Data...
      </p>
    </div>
  );
}
