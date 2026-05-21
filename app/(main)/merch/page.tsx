import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import MerchClient from './MerchClient';
import MerchHero from './MerchHero';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Official Merch Store | Brotherhood Legacy',
  description: 'Shop the official Brotherhood Legacy collection. Limited drops, premium apparel, and elite gear for the BHL community.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/merch',
  },
  openGraph: {
    title: 'Official Merch Store | Brotherhood Legacy',
    description: 'Shop the official Brotherhood Legacy collection. Limited drops, premium apparel, and elite gear for the BHL community.',
    url: 'https://bhl-website.vercel.app/merch',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Merch Store',
      }
    ],
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
