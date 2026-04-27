import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  socialLink: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  socialLink: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export const Application = models.Application || model<IApplication>('Application', ApplicationSchema);
