import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ... (rest of imports)

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const { name, description, price, image, images, stock, sizes, isLimitedDrop, category } = body;
    
    let totalStock = stock;
    if (sizes && sizes.length > 0) {
      totalStock = sizes.reduce((sum: number, sizeInfo: any) => sum + Number(sizeInfo.stock), 0);
    }
    
    const product = await Product.create({ 
      name, description, price, image, images: images || [], 
      stock: totalStock, sizes: sizes || [], isLimitedDrop, category 
    });
    
    // Trigger revalidation
    revalidatePath('/merch');

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await Product.findByIdAndDelete(id);
    
    // Trigger revalidation
    revalidatePath('/merch');

    return NextResponse.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
