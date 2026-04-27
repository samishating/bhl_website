import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const { name, description, price, image, images, stock, isLimitedDrop, category } = body;

    const product = await Product.findByIdAndUpdate(
      id,
      { name, description, price, image, images: images || [], stock, isLimitedDrop, category },
      { new: true }
    );

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
