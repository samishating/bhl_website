import HomeFixedBackground from '@/components/HomeFixedBackground';
import CinematicHero from '@/components/CinematicHero';
import HomeDivisions from '@/components/HomeDivisions';
import HomeLeaderboard from '@/components/HomeLeaderboard';
import HomeChallenges from '@/components/HomeChallenges';
import { getGlobalStats } from '@/lib/stats';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import styles from './page.module.css';


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
      {/* Ambient particle canvas (fixed, behind everything) */}
      <HomeFixedBackground />

      {/* HERO SECTION — CinematicHero owns its own <section id="hero"> */}
      <div id="hero" className={styles.heroStickyWrapper}>
        <CinematicHero statsData={{ members: stats.totalMembers, xp: stats.totalXP }} />
      </div>

      {/* DIVISIONS SECTION */}
      <HomeDivisions initialStats={stats} />

      {/* LEADERBOARD SECTION */}
      <HomeLeaderboard />

      {/* CHALLENGES SECTION */}
      <HomeChallenges initialChallenges={challenges} />

      {/* CTA SECTION BAND */}
      <section className="content-band" style={{ borderTop: 'none', paddingBottom: '160px' }}>
        <div className="section-divider" />
        <div className="content-inner" style={{ paddingTop: '5rem' }}>
          <div className="section-header">
            <span className="section-tag">Final Step</span>
            <h2>Ready to Write Your <span className="gradient-text">Legacy?</span></h2>
            <p className="section-desc">Join hundreds of members already building their story in the Brotherhood.</p>
          </div>
          <div className={styles.ctaBtns}>
              <a href="/register" className="btn btn-primary btn-lg" id="home-cta-join-btn">
                Create Account — It&apos;s Free
              </a>
              <a href="/apply" className="btn btn-ghost btn-lg" id="home-cta-apply-btn">
                Apply as Creator
              </a>
            </div>
        </div>
      </section>
    </div>
  );
}
