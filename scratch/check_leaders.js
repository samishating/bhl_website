const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brotherhood-legacy';

async function checkLeaders() {
  await mongoose.connect(MONGODB_URI);
  const divs = ['gaming', 'music', 'sport', 'content'];
  
  const UserSchema = new mongoose.Schema({
    username: String,
    divisions: [String],
    xp: Number,
    divisionXp: mongoose.Schema.Types.Mixed
  });
  const User = mongoose.model('User', UserSchema);

  for (const div of divs) {
    const leader = await User.findOne({ divisions: div })
      .sort({ [`divisionXp.${div}`]: -1, xp: -1 })
      .select('username divisionXp xp');
    console.log(`Leader for ${div}:`, leader ? `${leader.username} (${leader.divisionXp?.[div] || 0} divXP, ${leader.xp} totalXP)` : 'None');
  }
  process.exit(0);
}

checkLeaders();
