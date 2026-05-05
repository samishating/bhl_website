import { Schema, Document, models, model, Types } from 'mongoose';

export interface ICreatorVideo extends Document {
  videoId: string;         // YouTube video ID (unique)
  userId: Types.ObjectId;  // ref: User
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;        // https://youtube.com/watch?v=VIDEO_ID
  publishedAt: Date;
  // Admin-controlled flags — never overwritten by sync
  isFeatured: boolean;
  isHidden: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorVideoSchema = new Schema<ICreatorVideo>({
  videoId:      { type: String, required: true, unique: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channelId:    { type: String, required: true },
  title:        { type: String, default: '' },
  description:  { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  videoUrl:     { type: String, default: '' },
  publishedAt:  { type: Date, default: null },
  isFeatured:   { type: Boolean, default: false },
  isHidden:     { type: Boolean, default: false },
  source:       { type: String, default: 'youtube' },
}, { timestamps: true });

CreatorVideoSchema.index({ userId: 1 });
CreatorVideoSchema.index({ publishedAt: -1 });
CreatorVideoSchema.index({ isFeatured: -1, publishedAt: -1 });

export const CreatorVideo = models.CreatorVideo || model<ICreatorVideo>('CreatorVideo', CreatorVideoSchema);
