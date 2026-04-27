const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/bhl');
  
  const User = mongoose.connection.collection('users');
  const gaming = await User.find({ divisions: 'gaming' }).sort({ xp: -1 }).limit(1).toArray();
  const music = await User.find({ divisions: 'music' }).sort({ xp: -1 }).limit(1).toArray();
  
  console.log('Gaming leader:', gaming);
  console.log('Music leader:', music);
  
  process.exit(0);
}

run();
