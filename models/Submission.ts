import { Schema, Document, models, model, Types } from 'mongoose';

export interface ISubmission extends Document {
  userId: Types.ObjectId;
  challengeId: Types.ObjectId;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  xpAwarded: boolean;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
  proofUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  xpAwarded: { type: Boolean, default: false },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, { timestamps: true });

export const Submission = models.Submission || model<ISubmission>('Submission', SubmissionSchema);
