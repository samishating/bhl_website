require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./models/User').User;

async function run() {
  await mongoose.connect('mongodb://localhost:27017/brotherhood-legacy');
  const user = await User.findOne({ username: 'Chomor' });
  if (!user) return console.log('User not found');
  
  user.divisions = ['gaming', 'music', 'sport', 'content'];
  try {
    await user.save();
    console.log('Saved successfully');
  } catch (err) {
    console.error('Validation error:', err);
  }
  process.exit();
}
run();
