const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brotherhood-legacy';

async function listUsers() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({ username: String, divisions: [String], divisionXp: Object, xp: Number }));
  const users = await User.find({}).lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

listUsers();
