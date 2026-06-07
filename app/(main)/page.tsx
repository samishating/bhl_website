import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Brotherhood Legacy — BHL | Community Platform',
  description: 'The premier community platform for Gaming, Music, Sport & Content creators. Join the Brotherhood, earn XP, and build your legacy.',
  alternates: {
    canonical: '/',
  },
};

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
      <section className={`content-band ${styles.finalCtaBand}`} style={{ borderTop: 'none' }}>
        <div className="section-divider" />
        <div className="content-inner">
          <div className="section-header">
            <span className="section-tag">Get Started</span>
            <h2>Apply. Earn XP. <span className="gradient-text">Build your rank.</span></h2>
            <p className="section-desc">Create an account to track your XP, appear on the leaderboard, submit challenges, and apply to creator programs.</p>
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
