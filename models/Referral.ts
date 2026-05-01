import mongoose from 'mongoose';

export interface IReferral {
  _id: string;
  code: string;
  discountPercentage: number;
  assignedTo: mongoose.Types.ObjectId;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Referral = mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
