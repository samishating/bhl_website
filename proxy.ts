import { NextResponse, type NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { Giveaway } from '@/models/Giveaway';

// Why this exists: app/loading.tsx wraps every page in a Suspense boundary, so the response
// starts streaming (and commits to HTTP 200) before a detail page's awaited DB lookup can call
// notFound(). Next then only injects <meta name="robots" content="noindex"> — a soft 404.
// Checking existence here, before rendering starts, lets missing records return a real 404.
// The pages keep their own notFound() calls as the fallback.

// Rewriting to a path no route matches renders app/not-found.tsx with a 404 status, while the
// browser keeps the originally requested URL.
const NOT_FOUND_PATH = '/__not-found';

async function exists(pathname: string): Promise<boolean> {
  const [, section, key] = pathname.split('/');
  const id = decodeURIComponent(key);

  switch (section) {
    case 'merch':
      if (!Types.ObjectId.isValid(id)) return false;
      await connectDB();
      return Boolean(await Product.exists({ _id: id }));
    case 'users':
      if (!Types.ObjectId.isValid(id)) return false;
      await connectDB();
      return Boolean(await User.exists({ _id: id }));
    case 'giveaways':
      // Mirrors the page: a winners page only exists once the giveaway has been rolled.
      await connectDB();
      return Boolean(await Giveaway.exists({ shortcode: id, 'winners.0': { $exists: true } }));
    default:
      return true;
  }
}

export async function proxy(request: NextRequest) {
  try {
    if (!(await exists(request.nextUrl.pathname))) {
      return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
    }
  } catch {
    // A DB hiccup must never turn a real page into a 404 — let the page render and decide.
  }
  return NextResponse.next();
}

export const config = {
  // Full document requests only. Client-side navigations and prefetches carry the `rsc`
  // header; their status code is invisible to crawlers, so they skip the extra lookup.
  matcher: [
    { source: '/merch/:id', missing: [{ type: 'header', key: 'rsc' }] },
    { source: '/users/:id', missing: [{ type: 'header', key: 'rsc' }] },
    { source: '/giveaways/:slug', missing: [{ type: 'header', key: 'rsc' }] },
  ],
};
