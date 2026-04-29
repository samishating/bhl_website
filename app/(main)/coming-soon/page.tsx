'use client';
import Link from 'next/link';
import HomeFixedBackground from '@/components/HomeFixedBackground';
import styles from './page.module.css';

export default function ComingSoonPage() {
  return (
    <div className="coming-soon-page">
      <HomeFixedBackground />
      
      <section className={styles.hero}>
        <div className="container">
          <div className="section-tag">Phase 2</div>
          <h1>Coming <span className="gradient-text">Soon</span></h1>
          <p className={styles.heroSub}>
            We are working on something legendary. Stay tuned for the next evolution of the Brotherhood.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
