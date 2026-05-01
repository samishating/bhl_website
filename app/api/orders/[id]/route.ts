import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { status, items: newItems } = await req.json();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Handle status update
    if (status) {
      if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      // Logic for stock deduction when confirming/shipping (Backup/Manual deduction)
      if ((status === 'confirmed' || status === 'shipped') && !order.stockDeducted) {
        for (const item of order.items) {
          if (item.size) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.quantity, "sizes.$[elem].stock": -item.quantity }
            }, { arrayFilters: [{ "elem.size": item.size }] });
          } else {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
          }
        }
        order.stockDeducted = true;
      }

      // Logic for stock reversion when cancelling (Re-add to stock)
      if (status === 'cancelled' && order.stockDeducted) {
        for (const item of order.items) {
          if (item.size) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity, "sizes.$[elem].stock": item.quantity }
            }, { arrayFilters: [{ "elem.size": item.size }] });
          } else {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
          }
        }
        order.stockDeducted = false;
      }

      order.status = status;
      order.processedBy = payload.userId;
      order.processedAt = new Date();
    }

    // Handle items modification (size changes)
    if (newItems && Array.isArray(newItems)) {
      for (let i = 0; i < order.items.length; i++) {
        const oldItem = order.items[i];
        const newItem = newItems.find((ni: any) => ni.productId.toString() === oldItem.productId.toString());

        if (newItem && newItem.size !== oldItem.size) {
          // Revert old size stock
          if (oldItem.size) {
            await Product.findByIdAndUpdate(oldItem.productId, {
              $inc: { "sizes.$[elem].stock": oldItem.quantity }
            }, {
              arrayFilters: [{ "elem.size": oldItem.size }]
            });
          }
          
          // Apply new size stock
          if (newItem.size) {
            await Product.findByIdAndUpdate(oldItem.productId, {
              $inc: { "sizes.$[elem].stock": -oldItem.quantity }
            }, {
              arrayFilters: [{ "elem.size": newItem.size }]
            });
          }
          
          // Update order item
          order.items[i].size = newItem.size;
        }
      }
    }

    await order.save();
    return NextResponse.json({ order, message: 'Order updated successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
