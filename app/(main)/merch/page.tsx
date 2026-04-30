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
      <section className={styles.header}>
        <div className="container">
          <div className="section-tag">Official Store</div>
          <h1 className={styles.heroTitle}>BHL <span className="gradient-text">Merch</span></h1>
          <p className={styles.heroSub}>Rep the Brotherhood. Premium drops, limited editions, streetwear culture.</p>
        </div>
      </section>

      <div className="container">
        <MerchClient initialProducts={products} />
      </div>
    </div>
  );
}
