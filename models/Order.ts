import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customerInfo: {
    name: string;
    email: string;
    address: string;
    phone: string;
  };
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
  },
  status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, { timestamps: true });

export const Order = models.Order || model<IOrder>('Order', OrderSchema);
