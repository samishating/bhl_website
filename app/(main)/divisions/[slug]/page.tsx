import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Challenge } from '@/models/Challenge';
import mongoose from 'mongoose';
import styles from './page.module.css';

export const revalidate = 0; // Pure SSR: Instant updates for highly competitive divisions

const DIVISIONS = ['gaming', 'music', 'sport', 'content'];

export async function generateStaticParams() {
  return DIVISIONS.map((slug) => ({ slug }));
}

async function getDivisionData(slug: string) {
  await connectDB();
  const { syncDivisionStats } = await import('@/lib/leader-sync');
  
  let stat = await mongoose.connection.db!.collection('divisionstats').findOne({ divisionId: slug });
  
  if (!stat) {
    // If not found, sync it now (first time)
    await syncDivisionStats(slug);
    stat = await mongoose.connection.db!.collection('divisionstats').findOne({ divisionId: slug });
  }

  // Get active challenges
  const challenges = await Challenge.find({ division: slug, active: true })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  return {
    leader: stat?.leader || null,
    memberCount: stat?.memberCount || 0,
    challenges: JSON.parse(JSON.stringify(challenges))
  };
}


export default async function DivisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DIVISIONS.includes(slug)) notFound();

  const data = await getDivisionData(slug);
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className={styles.page}>
      <section className={styles.hero} style={{ '--div-color': getDivColor(slug) } as any}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className="section-tag">{title} Unit</div>
          <h1>The <span className="gradient-text">{title}</span> Division</h1>
          <p className={styles.heroSub}>
            Dominating the field of {slug} with {data.memberCount.toLocaleString()} elite members.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid-2">
          {/* Leader Card */}
          <div className="card">
            <h3 className={styles.cardTitle}>Division Leader</h3>
            {data.leader ? (
              <div className={styles.leaderRow}>
                <div className="avatar avatar-lg">
                  {data.leader.avatar ? <img src={data.leader.avatar} alt="" /> : data.leader.username[0]}
                </div>
                <div>
                  <div className={styles.leaderName}>{data.leader.username}</div>
                  <div className={styles.leaderXp}>{data.leader.xp.toLocaleString()} XP</div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No leader has emerged yet. Claim your spot.</p>
            )}
          </div>

          {/* Stats Card */}
          <div className="card">
            <h3 className={styles.cardTitle}>Unit Strength</h3>
            <div className={styles.statLarge}>{data.memberCount.toLocaleString()}</div>
            <p style={{ color: 'var(--text-secondary)' }}>Active members committed to the {title} legacy.</p>
          </div>
        </div>

        {/* Challenges Section */}
        <div className={styles.section}>
          <h2 className={styles.centeredTitle}>Active <span className="gradient-text">Challenges</span></h2>
          <div className="grid-3">
            {data.challenges.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active challenges for this division right now.
              </p>
            ) : (
              data.challenges.map((c: any) => (
                <div key={c._id} className="card">
                  <div className="section-tag" style={{ fontSize: '0.7rem' }}>{c.xpReward} XP</div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{c.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{c.description}</p>
                  <a href="/#challenges" className="btn btn-primary btn-sm">Join Challenge</a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDivColor(slug: string) {
  switch(slug) {
    case 'gaming': return '#FFFDBA';
    case 'music': return '#A855F7';
    case 'sport': return '#06B6D4';
    case 'content': return '#EF4444';
    default: return '#FF0000';
  }
}
