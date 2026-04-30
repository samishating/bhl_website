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
        <div className="container">
          <div className={styles.heroContent}>
            <div className="section-tag animate-fade-down" style={{ justifyContent: 'center' }}>Official Store</div>
            <h1 className={`${styles.heroTitle} animate-fade-up`}>
              BHL <span className="gradient-text">MERCH</span>
            </h1>
            <p className={`${styles.heroSub} animate-fade-up`} style={{ animationDelay: '0.2s' }}>
              REPRESENT THE BROTHERHOOD. PREMIUM APPAREL, LIMITED DROPS, AND EXCLUSIVE GEAR.
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <MerchClient initialProducts={products} />
      </div>
    </div>
  );
}
