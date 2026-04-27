import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  await connectDB();
  const totalMembers = await User.countDocuments();
  const xpResult = await User.aggregate([{ $group: { _id: null, totalXP: { $sum: '$xp' } } }]);
  const totalXP = xpResult[0]?.totalXP || 0;
  const completedChallenges = await mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' });

  const divisions = [
    { id: 'gaming', role: 'Gaming Division Lead', defaultIcon: '🎮' },
    { id: 'music', role: 'Music Division Lead', defaultIcon: '🎵' },
    { id: 'sport', role: 'Sport Division Lead', defaultIcon: '💪' },
    { id: 'content', role: 'Content Division Lead', defaultIcon: '🎬' },
  ];

  const team = await Promise.all(divisions.map(async (d) => {
    // Sort by division-specific XP
    const leader = await User.findOne({ divisions: d.id })
      .sort({ [`divisionXp.${d.id}`]: -1 })
      .select('username avatar');
    
    return {
      name: leader?.username || 'No contender yet',
      role: d.role,
      div: d.id,
      icon: (leader?.avatar && leader.avatar.trim() !== '') ? leader.avatar : d.defaultIcon
    };
  }));

  const values = [
    { icon: '⚔️', title: 'Brotherhood', desc: 'We elevate each other. No member is left behind.' },
    { icon: '🏆', title: 'Excellence', desc: 'We push our limits in everything we do.' },
    { icon: '🔥', title: 'Hustle', desc: 'Consistency beats talent when talent doesn\'t work hard.' },
    { icon: '🌍', title: 'Community', desc: 'We build together, grow together, win together.' },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className="section-tag">Our Story</div>
          <h1>About <span className="gradient-text">Brotherhood Legacy</span></h1>
          <p className={styles.heroSub}>
            Brotherhood Legacy isn&apos;t just a platform — it&apos;s a movement. Born from the streets of competitive gaming and digital culture, 
            BHL brings together the most driven individuals across Gaming, Music, Sport, and Content creation.
          </p>
        </div>
      </section>

      <div className="container">
        {/* Mission */}
        <div className={styles.missionCard}>
          <div className={styles.missionGlow} />
          <div className="section-tag">Mission</div>
          <h2>Forging <span className="gradient-text">Legends</span></h2>
          <p>
            Our mission is simple: create the most impactful multi-domain community in the world.
            A place where gamers, musicians, athletes, and creators can grow together, compete, 
            collaborate, and build their legacies — all under one brotherhood.
          </p>
        </div>

        {/* Values */}
        <div className={styles.valuesSection}>
          <h2 className={styles.centeredTitle}>Our <span className="gradient-text">Values</span></h2>
          <div className="grid-4">
            {values.map(v => (
              <div key={v.title} className="card" style={{ textAlign: 'center' }}>
                <div className={styles.valueIcon}>{v.icon}</div>
                <h4 style={{ fontFamily: 'Rajdhani', fontWeight: 700, marginBottom: '0.5rem' }}>{v.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className={styles.teamSection}>
          <h2 className={styles.centeredTitle}>Division <span className="gradient-text">Leaders</span></h2>
          <div className="grid-4">
            {team.map(member => (
              <div key={member.div} className={`card ${styles.teamCard}`}>
                <div className={`avatar avatar-lg ${styles.teamAvatar}`}>
                  {member.icon.startsWith('http') || member.icon.startsWith('/') || member.icon.startsWith('data:') ? (
                    <img src={member.icon} alt={member.name} />
                  ) : (
                    member.icon
                  )}
                </div>
                <div className={styles.teamName}>{member.name}</div>
                <div className={styles.teamRole}>{member.role}</div>
                <span className={`division-tag tag-${member.div}`}>{member.div}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsSection}>
          {[
            { num: `${totalMembers}+`, label: 'Active Members' },
            { num: '4', label: 'Divisions' },
            { num: `${completedChallenges}+`, label: 'Challenges Completed' },
            { num: '∞', label: 'Potential' },
          ].map(s => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
