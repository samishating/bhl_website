import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import MerchClient from './MerchClient';
import MerchHero from './MerchHero';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Official Merch Store',
  description: 'Shop the official Brotherhood Legacy collection. Limited drops, premium apparel, and elite gear for the BHL community.',
  alternates: {
    canonical: '/merch',
  }
};


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
