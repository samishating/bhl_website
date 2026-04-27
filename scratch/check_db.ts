import mongoose from 'mongoose';
import { connectDB } from '../lib/db';
import { User } from '../models/User';

async function check() {
  await connectDB();
  const count = await User.countDocuments();
  const users = await User.find().select('username email role isAdmin');
  console.log('User Count:', count);
  console.log('Users:', JSON.stringify(users, null, 2));
  process.exit(0);
}

check();
