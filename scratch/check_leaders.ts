import { connectDB } from './lib/db';
import { User } from './models/User';

async function checkLeaders() {
  await connectDB();
  const divs = ['gaming', 'music', 'sport', 'content'];
  for (const div of divs) {
    const leader = await User.findOne({ divisions: div })
      .sort({ [`divisionXp.${div}`]: -1, xp: -1 })
      .select('username divisionXp xp');
    console.log(`Leader for ${div}:`, leader ? `${leader.username} (${leader.divisionXp?.[div] || 0} divXP, ${leader.xp} totalXP)` : 'None');
  }
  process.exit(0);
}

checkLeaders();
