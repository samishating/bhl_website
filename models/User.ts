import { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  avatar: string;
  bio: string;
  xp: number;
  level: number;
  divisionXp: Record<string, number>;
  divisions: string[];
  badges: string[];
  role: 'user' | 'admin' | 'superadmin';
  lastLogin: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isPublic: boolean;
  isFeatured: boolean;
  displayOrder: number;
  socialLinks: {
    twitter?: string;
    youtube?: string;
    twitch?: string;
    instagram?: string;
    discord?: string;
  };
  featuredLinks: Array<{ title: string; url: string }>;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true, trim: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  divisionXp: {
    gaming: { type: Number, default: 0 },
    music: { type: Number, default: 0 },
    sport: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
  },
  divisions: [{ type: String, enum: ['gaming', 'music', 'sport', 'content'] }],
  badges: [{ type: String }],
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  lastLogin: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  isPublic: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  socialLinks: {
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitch: { type: String, default: '' },
    instagram: { type: String, default: '' },
    discord: { type: String, default: '' },
  },
  featuredLinks: [{
    title: { type: String },
    url: { type: String }
  }],
}, { timestamps: true });

UserSchema.index({ xp: -1 });
UserSchema.index({ 'divisionXp.gaming': -1 });
UserSchema.index({ 'divisionXp.music': -1 });
UserSchema.index({ 'divisionXp.sport': -1 });
UserSchema.index({ 'divisionXp.content': -1 });

export const User = models.User || model<IUser>('User', UserSchema);
