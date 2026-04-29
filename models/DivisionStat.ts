import mongoose from 'mongoose';

const DivisionStatSchema = new mongoose.Schema({
  divisionId: { type: String, required: true, unique: true },
  leader: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    xp: Number,
  },
  memberCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

export const DivisionStat = mongoose.models.DivisionStat || mongoose.model('DivisionStat', DivisionStatSchema);
