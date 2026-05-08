import { syncAllCreators } from '@/lib/server/youtube';
import { connectDB } from '@/lib/db';

async function run() {
  console.time('syncAllCreators');
  await connectDB();
  const result = await syncAllCreators();
  console.timeEnd('syncAllCreators');
  console.log('Result summary:', result);
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
