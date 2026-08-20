import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { User } from '@/models/User';

const BASE_URL = 'https://bhl-website.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/community`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/merch`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/apply`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let userRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const products = await Product.find({}).select('_id updatedAt').lean();
    productRoutes = products.map((p: any) => ({
      url: `${BASE_URL}/merch/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const users = await User.find({ isPublic: true }).select('_id updatedAt').lean();
    userRoutes = users.map((u: any) => ({
      url: `${BASE_URL}/users/${u._id}`,
      lastModified: u.updatedAt ? new Date(u.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));
  } catch {
    // DB unreachable at build time — fall back to static routes only
  }

  return [...staticRoutes, ...productRoutes, ...userRoutes];
}
