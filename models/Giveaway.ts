import { Schema, Document, models, model, Types } from 'mongoose';
import {
  GIVEAWAY_RULES,
  type GiveawayRule,
  type GiveawayEntrant,
  type GiveawayWinner,
} from '@/lib/giveaways';

// The rule enum and the entrant/winner shapes live in lib/giveaways.ts so that client
// components can import them without dragging mongoose into the browser bundle.
export type { GiveawayRule, GiveawayEntrant, GiveawayWinner };

export interface IGiveaway extends Document {
  title: string;
  postUrl: string;
  /** Instagram shortcode parsed from the URL — also the public winners-page slug. */
  shortcode: string;
  /** Numeric media id derived from the shortcode; the extractor userscript needs it. */
  mediaId?: string;
  endDate: Date;
  rules: GiveawayRule[];
  minMentions: number;
  winnerCount: number;
  entrants: GiveawayEntrant[];
  entrantsCapturedAt?: Date;
  entrantsSource?: 'userscript' | 'manual';
  ownerUsername?: string;
  winners: GiveawayWinner[];
  rolledAt?: Date;
  rolledBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EntrantSchema = new Schema<GiveawayEntrant>({
  username: { type: String, required: true, trim: true, lowercase: true },
  userId: { type: String },
  fullName: { type: String },
  profilePicUrl: { type: String },
  profileUrl: { type: String, required: true },
  comments: { type: [String], default: [] },
  mentions: { type: [String], default: [] },
  commentCount: { type: Number, default: 1 },
  liked: { type: Boolean, default: null },
  follows: { type: Boolean, default: null },
  disqualified: { type: Boolean, default: false },
  disqualifiedReason: { type: String },
}, { _id: false });

const WinnerSchema = new Schema<GiveawayWinner>({
  username: { type: String, required: true },
  profileUrl: { type: String, required: true },
  fullName: { type: String },
  profilePicUrl: { type: String },
}, { _id: false });

const GiveawaySchema = new Schema<IGiveaway>({
  title: { type: String, required: true, trim: true },
  postUrl: { type: String, required: true, trim: true },
  shortcode: { type: String, required: true, unique: true, index: true },
  mediaId: { type: String },
  endDate: { type: Date, required: true },
  rules: { type: [String], enum: GIVEAWAY_RULES, default: [] },
  minMentions: { type: Number, default: 1, min: 1 },
  winnerCount: { type: Number, required: true, default: 1, min: 1 },
  entrants: { type: [EntrantSchema], default: [] },
  entrantsCapturedAt: { type: Date },
  entrantsSource: { type: String, enum: ['userscript', 'manual'] },
  ownerUsername: { type: String },
  winners: { type: [WinnerSchema], default: [] },
  rolledAt: { type: Date },
  rolledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

GiveawaySchema.index({ endDate: -1 });

export const Giveaway = models.Giveaway || model<IGiveaway>('Giveaway', GiveawaySchema);
