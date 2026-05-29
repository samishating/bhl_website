'use client';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fadeUp } from '@/lib/animations';
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
  xp?: number;
  level?: number;
  isFeatured?: boolean;
  socialLinks?: {
    twitch?: string;
  };
}

interface TwitchLiveCarouselProps {
  streams: TwitchLiveStream[];
  creators: TwitchCreator[];
}

type RankedTwitchCreator = TwitchCreator & {
  displayName: string;
  isLive: boolean;
  stream?: TwitchLiveStream;
  twitchUrl: string;
};

const PAGE_SIZE = 5;

function normalizeTwitchUrl(url?: string) {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function streamStartTime(stream?: TwitchLiveStream) {
  if (!stream?.startedAt) return Number.MAX_SAFE_INTEGER;
  const time = new Date(stream.startedAt).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function creatorPower(creator: TwitchCreator) {
  return creator.xp ?? creator.level ?? 0;
}

export default function TwitchLiveCarousel({ streams, creators }: TwitchLiveCarouselProps) {
  const [page, setPage] = useState(0);

  const rankedCreators = useMemo(() => {
    const liveByCreatorId = new Map(streams.map(stream => [stream.creatorId, stream]));

    return creators
      .map((creator): RankedTwitchCreator => {
        const stream = liveByCreatorId.get(creator._id);
        return {
          ...creator,
          displayName: stream?.displayName || creator.creatorDisplayName || creator.username,
          isLive: Boolean(stream),
          stream,
          twitchUrl: stream?.url || normalizeTwitchUrl(creator.socialLinks?.twitch),
        };
      })
      .sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        if (a.isLive && b.isLive && Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
          return a.isFeatured ? -1 : 1;
        }
        if (a.isLive && b.isLive && a.isFeatured && b.isFeatured) {
          return streamStartTime(a.stream) - streamStartTime(b.stream);
        }
        return creatorPower(b) - creatorPower(a);
      });
  }, [creators, streams]);

  if (rankedCreators.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(rankedCreators.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageCreators = rankedCreators.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const featuredCreator = pageCreators[0];
  const compactCreators = pageCreators.slice(1);

  const goPrevious = () => setPage(current => (current === 0 ? totalPages - 1 : current - 1));
  const goNext = () => setPage(current => (current + 1) % totalPages);

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
          <p className={styles.sectionSubtitle}>Live creators first, then Brotherhood Twitch creators by level</p>
        </div>

        {totalPages > 1 && (
          <div className={styles.twitchPager}>
            <button onClick={goPrevious} aria-label="Previous Twitch creators" title="Previous">
              <ChevronLeft size={20} />
            </button>
            <span>{safePage + 1} / {totalPages}</span>
            <button onClick={goNext} aria-label="Next Twitch creators" title="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={safePage}
          className={styles.twitchPageLayout}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <TwitchCreatorCard creator={featuredCreator} variant="featured" />

          {compactCreators.length > 0 && (
            <div className={styles.twitchCompactGrid}>
              {compactCreators.map(creator => (
                <TwitchCreatorCard key={creator._id} creator={creator} variant="compact" />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TwitchCreatorCard({ creator, variant }: { creator: RankedTwitchCreator; variant: 'featured' | 'compact' }) {
  const isFeaturedLayout = variant === 'featured';
  const stream = creator.stream;

  return (
    <motion.a
      href={creator.twitchUrl}
      target="_blank"
      rel="noreferrer"
      className={`${styles.creatorCard} ${styles.twitchCard} ${styles.twitchRankedCard} ${isFeaturedLayout ? styles.twitchFeaturedCard : styles.twitchCompactCard} ${!creator.isLive ? styles.twitchOfflineCard : ''}`}
      variants={fadeUp}
      whileHover={{ y: isFeaturedLayout ? -4 : -2, transition: { duration: 0.2 } }}
    >
      <div className={`${styles.cardImage} ${styles.twitchRankedMedia} ${!creator.isLive ? styles.offlineImagePane : ''}`}>
        {creator.isLive && stream ? (
          <img src={stream.thumbnail} alt={`${creator.displayName} live stream`} />
        ) : (
          <div className={`${styles.offlineAvatarWrap} ${isFeaturedLayout ? styles.offlineAvatarFeatured : ''}`}>
            {creator.avatar ? (
              <img src={creator.avatar} alt={`${creator.displayName} Twitch profile`} />
            ) : (
              <span>{creator.displayName[0]?.toUpperCase()}</span>
            )}
          </div>
        )}

        <div className={styles.liveMetaBadges}>
          {creator.isLive && stream ? (
            <>
              <span className={styles.liveStatusBadge}>
                <span />
                LIVE
              </span>
              <span className={styles.viewerBadge}>
                <FaEye /> {stream.viewers.toLocaleString()}
              </span>
            </>
          ) : (
            <span className={styles.offlineStatusBadge}>OFFLINE</span>
          )}
        </div>

        {creator.isFeatured && <span className={styles.twitchFeaturedBadge}>Featured</span>}
        <div className={styles.cardOverlay} />
      </div>

      <div className={`${styles.cardContent} ${styles.twitchCardContent}`}>
        <div className={styles.streamGameRow}>
          <span className={creator.isLive ? styles.streamGameBadge : styles.offlineGameBadge}>
            {creator.isLive && stream ? stream.game : `Level ${creator.level || 1}`}
          </span>
        </div>

        <div className={styles.streamText}>
          <div className={styles.streamCreatorName}>{creator.displayName}</div>
          <div className={styles.streamTitle}>
            {creator.isLive && stream
              ? stream.title
              : 'Currently offline. Check their Twitch channel for the next broadcast.'}
          </div>
        </div>

        <div className={creator.isLive ? styles.watchTwitchButton : styles.offlineTwitchButton}>
          <FaTwitch /> {creator.isLive ? 'Watch on Twitch' : 'Visit Twitch'}
        </div>
      </div>
    </motion.a>
  );
}
