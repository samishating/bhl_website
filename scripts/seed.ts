import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { calculateLevel, getDivisionBadge, BADGES } from '../lib/xp';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brotherhood-legacy';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await mongoose.connection.db!.collection('users').deleteMany({});
  await mongoose.connection.db!.collection('challenges').deleteMany({});
  await mongoose.connection.db!.collection('products').deleteMany({});
  await mongoose.connection.db!.collection('submissions').deleteMany({});
  console.log('🗑  Cleared existing data');

  const hashedPass = await bcrypt.hash('password123', 12);
  const adminPass  = await bcrypt.hash('admin123', 12);

  // Users
  const usersData = [
    { email: 'superadmin@bhl.gg', password: adminPass, username: 'SuperAdmin', xp: 9999, divisions: ['gaming', 'music', 'sport', 'content'], badges: ['FOUNDER', 'RANKED', 'CHALLENGER', 'GAMING_ELITE'], role: 'superadmin' },
    { email: 'admin@bhl.gg', password: adminPass, username: 'Admin', xp: 9999, divisions: ['gaming', 'music', 'sport', 'content'], badges: ['FOUNDER', 'RANKED', 'CHALLENGER', 'GAMING_ELITE'], role: 'admin' },
    { email: 'xenon@bhl.gg', password: hashedPass, username: 'XenonX', xp: 4200, divisions: ['gaming'], badges: ['FOUNDER', 'RANKED', 'CHALLENGER', 'GAMING_ELITE'] },
    { email: 'beatl@bhl.gg', password: hashedPass, username: 'BeatLord', xp: 3800, divisions: ['music'], badges: ['FOUNDER', 'RANKED', 'MUSIC_ARTIST'] },
    { email: 'iron@bhl.gg', password: hashedPass, username: 'IronWolf', xp: 3100, divisions: ['sport'], badges: ['FOUNDER', 'RANKED', 'SPORT_BEAST'] },
    { email: 'clip@bhl.gg', password: hashedPass, username: 'ClipMaster', xp: 2750, divisions: ['content'], badges: ['FOUNDER', 'RANKED', 'CONTENT_KING'] },
    { email: 'neo@bhl.gg', password: hashedPass, username: 'NeoStrike', xp: 1800, divisions: ['gaming', 'sport'], badges: ['FOUNDER', 'CHALLENGER', 'GAMING_ELITE', 'SPORT_BEAST'] },
    { email: 'luna@bhl.gg', password: hashedPass, username: 'LunaTracks', xp: 1200, divisions: ['music', 'content'], badges: ['FOUNDER', 'MUSIC_ARTIST', 'CONTENT_KING'] },
    { email: 'ghost@bhl.gg', password: hashedPass, username: 'Ghost7', xp: 750, divisions: ['gaming'], badges: ['FOUNDER', 'GAMING_ELITE'] },
    { email: 'viper@bhl.gg', password: hashedPass, username: 'ViperFit', xp: 400, divisions: ['sport'], badges: ['FOUNDER', 'SPORT_BEAST'] },
    { email: 'nova@bhl.gg', password: hashedPass, username: 'NovaClip', xp: 150, divisions: ['content'], badges: ['FOUNDER', 'CONTENT_KING'] },
  ].map(u => ({ ...u, level: calculateLevel(u.xp), lastLogin: new Date() }));

  await mongoose.connection.db!.collection('users').insertMany(usersData);
  console.log(`👥 Seeded ${usersData.length} users`);

  // Challenges
  const challengesData = [
    { title: 'Win 5 Ranked Games', description: 'Win 5 consecutive ranked matches on any competitive game. Screenshot the results screen.', xpReward: 50, division: 'gaming', active: true },
    { title: 'Tournament Placement', description: 'Place top 3 in any online tournament. Upload your bracket screenshot.', xpReward: 100, division: 'gaming', active: true },
    { title: '30-Day Workout Streak', description: 'Work out every day for 30 days. Post daily progress photos.', xpReward: 150, division: 'sport', active: true },
    { title: '100kg Bench Press', description: 'Hit 100kg on bench press. Provide a video of the lift.', xpReward: 80, division: 'sport', active: true },
    { title: 'Release an Original Track', description: 'Release an original track on any platform (SoundCloud, Spotify, etc.). Share the link.', xpReward: 75, division: 'music', active: true },
    { title: 'Collab with Another Member', description: 'Create and release a collab with another BHL Music member. Both must tag BHL.', xpReward: 100, division: 'music', active: true },
    { title: 'Viral Post (1K Views)', description: 'Create a post, reel, or video that reaches 1,000+ organic views. Screenshot analytics.', xpReward: 60, division: 'content', active: true },
    { title: 'Weekly BHL Meme Drop', description: 'Post 5 original BHL memes in a single week. Must be original content.', xpReward: 40, division: 'content', active: true },
    { title: 'Brotherhood Introduction', description: 'Post a video introducing yourself to the Brotherhood on any platform.', xpReward: 30, division: 'all', active: true },
  ];

  await mongoose.connection.db!.collection('challenges').insertMany(challengesData);
  console.log(`🏆 Seeded ${challengesData.length} challenges`);

  // Products
  const productsData = [
    { name: 'BHL Legacy Hoodie', description: 'Premium heavyweight hoodie with embroidered Brotherhood Legacy logo. Streetwear grade quality.', price: 79.99, image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&q=80', stock: 50, isLimitedDrop: false, category: 'apparel' },
    { name: 'BHL Neon Jersey', description: 'Gaming-inspired team jersey with neon blue accents and your username printed on the back.', price: 59.99, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80', stock: 30, isLimitedDrop: true, category: 'apparel' },
    { name: 'Brotherhood Cap', description: 'Embroidered snapback cap. Adjustable fit, premium material. Rep BHL everywhere you go.', price: 34.99, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80', stock: 75, isLimitedDrop: false, category: 'accessories' },
    { name: 'BHL Gaming Mousepad XL', description: 'Extra-large gaming mousepad with BHL Brotherhood Legacy artwork. Non-slip base, stitched edges.', price: 44.99, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&q=80', stock: 40, isLimitedDrop: false, category: 'gear' },
    { name: 'Founder Edition T-Shirt', description: 'Exclusive Founder edition tee. Limited to 100 pieces. Proof of being an OG Brotherhood member.', price: 49.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80', stock: 8, isLimitedDrop: true, category: 'apparel' },
    { name: 'BHL Digital Wallpack', description: 'Pack of 20 premium 4K wallpapers featuring BHL artwork, logos, and division art.', price: 9.99, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80', stock: 999, isLimitedDrop: false, category: 'digital' },
  ];

  await mongoose.connection.db!.collection('products').insertMany(productsData);
  console.log(`👕 Seeded ${productsData.length} products`);

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Superadmin:   superadmin@bhl.gg / admin123');
  console.log('Admin login:  admin@bhl.gg      / admin123');
  console.log('Member login: xenon@bhl.gg      / password123');
  console.log('─────────────────────────────────');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
