import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Referral } from '@/models/Referral';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { items, total, customerInfo, referralCode } = await req.json();

    if (!items || items.length === 0 || !customerInfo) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Validate referral code server-side
    let finalTotal = total;
    let discountApplied = 0;
    let validReferral = null;

    if (referralCode) {
      validReferral = await Referral.findOne({ code: referralCode.toUpperCase().trim(), isActive: true });
      if (validReferral) {
        discountApplied = validReferral.discountPercentage;
        finalTotal = parseFloat((total * (1 - discountApplied / 100)).toFixed(2));
      }
    }

    // 2. Decrement stock instantly as per user request: "no deduct it instantly"
    for (const item of items) {
      if (item.size) {
        // Decrement both global stock and specific size stock
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: -item.quantity,
            "sizes.$[elem].stock": -item.quantity 
          }
        }, {
          arrayFilters: [{ "elem.size": item.size }]
        });
      } else {
        // Only decrement global stock if no size
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    // Create the order with stockDeducted: true
    const order = await Order.create({
      userId: payload.userId,
      items,
      total: finalTotal,
      referralCode: validReferral ? validReferral.code : undefined,
      discountApplied: discountApplied > 0 ? discountApplied : undefined,
      customerInfo,
      status: 'pending',
      stockDeducted: true
    });

    // Increment referral usage count
    if (validReferral) {
      await Referral.findByIdAndUpdate(validReferral._id, { $inc: { usageCount: 1 } });
    }

    return NextResponse.json({ order, message: 'Order placed successfully' }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({})
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 });
    return NextResponse.json({ orders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
