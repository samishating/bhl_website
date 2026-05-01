import { Schema, Document, models, model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  sizes: { size: string; stock: number }[];
  isLimitedDrop: boolean;
  category: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: Number, default: 100 },
  sizes: {
    type: [{
      size: { type: String, required: true },
      stock: { type: Number, required: true, min: 0 }
    }],
    default: []
  },
  isLimitedDrop: { type: Boolean, default: false },
  category: { type: String, enum: ['apparel', 'accessories', 'gear', 'digital'], default: 'apparel' },
}, { timestamps: true });

export const Product = models.Product || model<IProduct>('Product', ProductSchema);
