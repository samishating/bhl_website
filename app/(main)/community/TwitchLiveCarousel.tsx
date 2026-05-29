'use client';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { FaEye, FaTwitch } from 'react-icons/fa';
import styles from './page.module.css';

interface TwitchLiveStream {
  creatorId: string;
  twitchLogin: string;
  displayName: string;
  title: string;
  game: string;
  viewers: number;
  startedAt: string;
  thumbnail: string;
  url: string;
}

interface TwitchLiveCarouselProps {
  streams: TwitchLiveStream[];
}

export default function TwitchLiveCarousel({ streams }: TwitchLiveCarouselProps) {
  if (!streams || streams.length === 0) return null;

  return (
    <div className={styles.liveCarousel}>
      <div className={`${styles.sectionHeader} ${styles.liveSectionHeader}`}>
        <div>
          <div className={styles.liveTitleRow}>
            <span className={`section-tag ${styles.liveNowTag}`}>LIVE NOW</span>
            <h2 className={`${styles.sectionTitle} ${styles.liveTitle}`}>
              ON <span><FaTwitch /> TWITCH</span>
            </h2>
          </div>
          <p className={styles.sectionSubtitle}>Support brotherhood creators streaming live right now</p>
        </div>
      </div>

      <motion.div
        className={`${styles.creatorScroll} ${styles.liveStreamScroll}`}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {streams.map((stream) => (
          <motion.div
            key={stream.creatorId}
            variants={fadeUp}
            className={`${styles.creatorItem} ${styles.liveCreatorItem}`}
          >
            <a
              href={stream.url}
              target="_blank"
              rel="noreferrer"
              className={`${styles.creatorCard} ${styles.twitchCard}`}
            >
              <div className={styles.cardImage}>
                <img src={stream.thumbnail} alt={`${stream.displayName} live stream`} />

                <div className={styles.liveMetaBadges}>
                  <span className={styles.liveStatusBadge}>
                    <span />
                    LIVE
                  </span>

                  <span className={styles.viewerBadge}>
                    <FaEye /> {stream.viewers.toLocaleString()}
                  </span>
                </div>

                <div className={styles.cardOverlay} />
              </div>

              <div className={`${styles.cardContent} ${styles.twitchCardContent}`}>
                <div className={styles.streamGameRow}>
                  <span className={styles.streamGameBadge}>{stream.game}</span>
                </div>

                <div className={styles.streamText}>
                  <div className={styles.streamCreatorName}>{stream.displayName}</div>
                  <div className={styles.streamTitle}>{stream.title}</div>
                </div>

                <div className={styles.watchTwitchButton}>
                  <FaTwitch /> Watch on Twitch
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
