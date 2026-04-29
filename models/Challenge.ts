import { Schema, Document, models, model } from 'mongoose';

export interface IChallenge extends Document {
  title: string;
  description: string;
  xpReward: number;
  division: string;
  active: boolean;
  allowRepeats: boolean;
  createdAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  xpReward: { type: Number, required: true, default: 50 },
  division: { type: String, enum: ['gaming', 'music', 'sport', 'content'], default: 'gaming' },
  active: { type: Boolean, default: true },
  allowRepeats: { type: Boolean, default: false },
}, { timestamps: true });

export const Challenge = models.Challenge || model<IChallenge>('Challenge', ChallengeSchema);
