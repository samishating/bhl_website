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
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroVisualZone} aria-hidden="true" />

        <div className={styles.heroTextContainer}>
          <span className={`${styles.heroTechTag} animate-fade-down`}>[ COLLECTION // 2026 ]</span>

          <h1 className={styles.heroTitleBlock}>
            <span className={`${styles.titleBHL} animate-fade-up`}>BHL</span>
            <span className={`${styles.titleMerch} animate-fade-up`} style={{ animationDelay: '0.1s' }}>
              MERCH
            </span>
          </h1>

        </div>
      </section>

      <div className="container">
        <MerchClient initialProducts={products} />
      </div>
    </div>
  );
}
