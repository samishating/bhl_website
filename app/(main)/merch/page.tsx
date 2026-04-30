import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import MerchClient from './MerchClient';
import styles from './page.module.css';

export const revalidate = 60; // ISR: 1 minute fallback

async function getProducts() {
  await connectDB();
  const products = await Product.find({}).lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function MerchPage() {
  const products = await getProducts();

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <img src="/backgrounds/merch-banner.png" alt="BHL Merch Banner" className={styles.bannerImg} />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroGrid}>
          {/* LEFT 40%: VISUAL AREA (Implicitly handled by background image positioning or a placeholder if needed) */}
          <div className={styles.heroVisualZone} />

          {/* RIGHT 60%: TEXT BLOCK */}
          <div className={styles.heroTextContainer}>
            <div className={styles.heroContentInner}>
              <div className={`${styles.heroTechTag} animate-fade-down`}>
                [ COLLECTION // 2026 ]
              </div>
              <div className={styles.heroTitleBlock}>
                <h1 className={`${styles.titleBHL} animate-fade-up`}>BHL</h1>
                <h1 className={`${styles.titleMerch} animate-fade-up`} style={{ animationDelay: '0.1s' }}>
                  <span className="gradient-text">MERCH</span>
                </h1>
              </div>
              <p className={`${styles.heroSub} animate-fade-up`} style={{ animationDelay: '0.2s' }}>
                PREMIUM APPAREL & EXCLUSIVE GEAR
              </p>
            </div>
          </div>
        </div>
        
        {/* BACKGROUND LOGO */}
        <div className={styles.heroDragon} />
      </section>

      <div className="container">
        <MerchClient initialProducts={products} />
      </div>
    </div>
  );
}
