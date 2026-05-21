import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 60;

async function getProduct(id: string) {
  await connectDB();
  try {
    const product = await Product.findById(id).lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | Brotherhood Legacy',
      description: 'The requested product could not be found.'
    };
  }

  const title = `${product.name} | Brotherhood Legacy Merch`;
  const desc = product.description.length > 155 ? product.description.slice(0, 155) + '...' : product.description;

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://bhl-website.vercel.app/merch/${id}`,
    },
    openGraph: {
      title,
      description: product.description,
      url: `https://bhl-website.vercel.app/merch/${id}`,
      siteName: 'Brotherhood Legacy',
      type: 'website',
      images: [
        {
          url: product.image || product.images?.[0] || 'https://bhl-website.vercel.app/brand/logo.png',
          alt: product.name,
        }
      ],
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || product.images?.[0] || 'https://bhl-website.vercel.app/brand/logo.png',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://bhl-website.vercel.app/merch/${product._id}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
