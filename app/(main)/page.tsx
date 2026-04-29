import HomeFixedBackground from '@/components/HomeFixedBackground';
import HeroClient from '@/components/HeroClient';
import HomeDivisions from '@/components/HomeDivisions';
import HomeLeaderboard from '@/components/HomeLeaderboard';
import HomeChallenges from '@/components/HomeChallenges';
import { getGlobalStats } from '@/lib/stats';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import styles from './page.module.css';

export const revalidate = 3600; // Revalidate every hour

async function getInitialChallenges() {
  await connectDB();
  const challenges = await Challenge.find({ division: 'global', active: true }).sort({ createdAt: -1 }).limit(6).lean();
  return JSON.parse(JSON.stringify(challenges));
}

export default async function HomePage() {
  const [stats, challenges] = await Promise.all([
    getGlobalStats(),
    getInitialChallenges()
  ]);

  return (
    <div className="home-page">
      {/* Fixed Background */}
      <HomeFixedBackground />

      {/* HERO SECTION */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <HeroClient statsData={{ members: stats.totalMembers, xp: stats.totalXP }} />
        </div>
      </section>

      {/* DIVISIONS SECTION */}
      <HomeDivisions initialStats={stats} />

      {/* LEADERBOARD SECTION */}
      <HomeLeaderboard />

      {/* CHALLENGES SECTION */}
      <HomeChallenges initialChallenges={challenges} />

      {/* CTA SECTION BAND */}
      <section className="content-band" style={{ borderTop: 'none', paddingBottom: '160px' }}>
        <div className="content-inner">
          <div className={styles.ctaContent}>
            <h2>Ready to Write Your <span className="gradient-text">Legacy?</span></h2>
            <p>Join hundreds of members already building their story in the Brotherhood.</p>
            <div className={styles.ctaBtns}>
              <a href="/register" className="btn btn-primary btn-lg" id="home-cta-join-btn">
                Create Account — It's Free
              </a>
              <a href="/about" className="btn btn-ghost btn-lg" id="home-cta-about-btn">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
