const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brotherhood-legacy';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    divisionXp: { type: Object, default: {} },
    xp: Number
  }));

  const users = await User.find({});
  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    const divXp = user.divisionXp || {};
    const updatedDivXp = {
      gaming: divXp.gaming || 0,
      music: divXp.music || 0,
      sport: divXp.sport || 0,
      content: divXp.content || 0
    };
    
    await User.updateOne(
      { _id: user._id },
      { $set: { divisionXp: updatedDivXp } }
    );
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(console.error);
