import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IApplication extends Document {
  userId?: mongoose.Types.ObjectId;
  division: string;
  name: string;
  email: string;
  discord: string;
  motivation: string;
  links: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  division: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  discord: { type: String, default: '' },
  motivation: { type: String, required: true },
  links: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export const Application = models.Application || model<IApplication>('Application', ApplicationSchema);
