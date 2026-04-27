import mongoose, { Schema, Document, models, model } from 'mongoose';

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
    type: Map, 
    of: Number, 
    default: () => ({ gaming: 0, music: 0, sport: 0, content: 0 }) 
  },
  divisions: [{ type: String, enum: ['gaming', 'music', 'sport', 'content'] }],
  badges: [{ type: String }],
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

if (mongoose.models.User) {
  mongoose.deleteModel('User');
}
export const User = model<IUser>('User', UserSchema);
