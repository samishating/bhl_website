import dynamic from 'next/dynamic';
import HomeFixedBackground from '@/components/HomeFixedBackground';
const HeroClient = dynamic(() => import('@/components/HeroClient'), { ssr: true });
const HomeDivisions = dynamic(() => import('@/components/HomeDivisions'), { ssr: false });
const HomeLeaderboard = dynamic(() => import('@/components/HomeLeaderboard'), { ssr: false });
const HomeChallenges = dynamic(() => import('@/components/HomeChallenges'), { ssr: false });
import { getGlobalStats } from '@/lib/stats';
import styles from './page.module.css';

export const revalidate = 60;
export default async function HomePage() {
  const stats = await getGlobalStats();

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
      <HomeDivisions />

      {/* LEADERBOARD SECTION */}
      <HomeLeaderboard />

      {/* CHALLENGES SECTION */}
      <HomeChallenges />

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
