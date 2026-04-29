import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.glow} />
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <img src="/brand/logo.webp" alt="BHL" style={{ height: '48px', objectFit: 'contain' }} />
            </Link>
            <p className={styles.tagline}>Rise. Compete. Dominate.</p>
            <p className={styles.desc}>
              The premier community for Gaming, Music, Sport & Content creators.
              Join the Brotherhood and write your legacy.
            </p>
          </div>

          <div className={styles.links}>
            <h4>Platform</h4>
            <ul>
              <li><Link href="/#divisions">Divisions</Link></li>
              <li><Link href="/#leaderboard">Leaderboard</Link></li>
              <li><Link href="/#challenges">Challenges</Link></li>
              <li><Link href="/#hero">Join Us</Link></li>
            </ul>
          </div>

          <div className={styles.links}>
            <h4>Store</h4>
            <ul>
              <li><Link href="/merch">All Products</Link></li>
              <li><Link href="/merch?filter=drop">Limited Drops</Link></li>
              <li><Link href="/merch?category=apparel">Apparel</Link></li>
              <li><Link href="/merch?category=accessories">Accessories</Link></li>
            </ul>
          </div>

          <div className={styles.links}>
            <h4>Join</h4>
            <ul>
              <li><Link href="/register">Create Account</Link></li>
              <li><Link href="/apply">Apply to BHL</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Brotherhood Legacy. All rights reserved.</p>
          <div className={styles.divisionTags}>
            <span className="division-tag tag-gaming">Gaming</span>
            <span className="division-tag tag-music">Music</span>
            <span className="division-tag tag-sport">Sport</span>
            <span className="division-tag tag-content">Content</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
