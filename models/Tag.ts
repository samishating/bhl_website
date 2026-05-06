import { Schema, Document, models, model } from 'mongoose';

export interface ITag extends Document {
  name: string;
  key: string;
  color: string;
  type: 'division' | 'role' | 'badge' | 'creator';
  description: string;
  requirements: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  color: { type: String, default: '#FFFFFF' },
  type: { 
    type: String, 
    enum: ['division', 'role', 'badge', 'creator'], 
    default: 'badge' 
  },
  description: { type: String, default: '' },
  requirements: { type: String, default: '' },
}, { timestamps: true });

export const Tag = models.Tag || model<ITag>('Tag', TagSchema);
