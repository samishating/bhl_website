import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  levelProgression: [
    {
      level: { type: Number, required: true },
      title: { type: String, required: true },
      xpRequired: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
