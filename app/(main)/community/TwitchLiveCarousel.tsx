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

interface TwitchCreator {
  _id: string;
  username: string;
  creatorDisplayName?: string;
  avatar?: string;
  socialLinks?: {
    twitch?: string;
  };
}

interface TwitchLiveCarouselProps {
  streams: TwitchLiveStream[];
  creators: TwitchCreator[];
}

function normalizeTwitchUrl(url?: string) {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

export default function TwitchLiveCarousel({ streams, creators }: TwitchLiveCarouselProps) {
  if (!creators || creators.length === 0) return null;

  const liveByCreatorId = new Map(streams.map(stream => [stream.creatorId, stream]));

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
          <p className={styles.sectionSubtitle}>Brotherhood creators on Twitch, live or offline</p>
        </div>
      </div>

      <motion.div
        className={`${styles.creatorScroll} ${styles.liveStreamScroll}`}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {creators.map((creator) => {
          const stream = liveByCreatorId.get(creator._id);
          const isLive = Boolean(stream);
          const displayName = stream?.displayName || creator.creatorDisplayName || creator.username;
          const twitchUrl = stream?.url || normalizeTwitchUrl(creator.socialLinks?.twitch);

          return (
            <motion.div
              key={creator._id}
              variants={fadeUp}
              className={`${styles.creatorItem} ${styles.liveCreatorItem}`}
            >
              <a
                href={twitchUrl}
                target="_blank"
                rel="noreferrer"
                className={`${styles.creatorCard} ${styles.twitchCard} ${!isLive ? styles.twitchOfflineCard : ''}`}
              >
                <div className={`${styles.cardImage} ${!isLive ? styles.offlineImagePane : ''}`}>
                  {isLive ? (
                    <img src={stream!.thumbnail} alt={`${displayName} live stream`} />
                  ) : (
                    <div className={styles.offlineAvatarWrap}>
                      {creator.avatar ? (
                        <img src={creator.avatar} alt={`${displayName} Twitch profile`} />
                      ) : (
                        <span>{displayName[0]?.toUpperCase()}</span>
                      )}
                    </div>
                  )}

                  <div className={styles.liveMetaBadges}>
                    {isLive ? (
                      <>
                        <span className={styles.liveStatusBadge}>
                          <span />
                          LIVE
                        </span>

                        <span className={styles.viewerBadge}>
                          <FaEye /> {stream!.viewers.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className={styles.offlineStatusBadge}>OFFLINE</span>
                    )}
                  </div>

                  <div className={styles.cardOverlay} />
                </div>

                <div className={`${styles.cardContent} ${styles.twitchCardContent}`}>
                  <div className={styles.streamGameRow}>
                    <span className={isLive ? styles.streamGameBadge : styles.offlineGameBadge}>
                      {isLive ? stream!.game : 'Twitch Creator'}
                    </span>
                  </div>

                  <div className={styles.streamText}>
                    <div className={styles.streamCreatorName}>{displayName}</div>
                    <div className={styles.streamTitle}>
                      {isLive ? stream!.title : 'Currently offline. Check their Twitch channel for the next broadcast.'}
                    </div>
                  </div>

                  <div className={isLive ? styles.watchTwitchButton : styles.offlineTwitchButton}>
                    <FaTwitch /> {isLive ? 'Watch on Twitch' : 'Visit Twitch'}
                  </div>
                </div>
              </a>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
