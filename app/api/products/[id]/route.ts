import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const { name, description, price, image, images, stock, sizes, isLimitedDrop, category } = body;

    let totalStock = stock;
    if (sizes && sizes.length > 0) {
      totalStock = sizes.reduce((sum: number, sizeInfo: any) => sum + Number(sizeInfo.stock), 0);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { name, description, price, image, images: images || [], stock: totalStock, sizes: sizes || [], isLimitedDrop, category },
      { new: true }
    );

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    
    // Trigger revalidation
    revalidatePath('/merch');

    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
