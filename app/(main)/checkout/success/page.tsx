import Link from 'next/link';

export const metadata = {
  title: 'Order Confirmed | Brotherhood Legacy',
};

export default function CheckoutSuccessPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
        <h1 style={{ 
          fontFamily: 'Rajdhani', 
          fontWeight: 800, 
          fontSize: '2.5rem', 
          textTransform: 'uppercase', 
          marginBottom: '1rem' 
        }}>
          Order Confirmed!
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
          Your Brotherhood Legacy order has been placed successfully.
          Our team will process your order and reach out to you shortly.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/merch" className="btn btn-primary">
            CONTINUE SHOPPING
          </Link>
          <Link href="/profile" className="btn btn-ghost">
            VIEW PROFILE
          </Link>
        </div>
      </div>
    </div>
  );
}
