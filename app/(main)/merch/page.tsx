import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import MerchClient from './MerchClient';
import MerchHero from './MerchHero';
import styles from './page.module.css';


async function getProducts() {
  await connectDB();
  const products = await Product.find({}).lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function MerchPage() {
  const products = await getProducts();

  return (
    <div className={styles.page}>
      <MerchHero />

      <div className="container">
        <MerchClient initialProducts={products} />
      </div>
    </div>
  );
}
