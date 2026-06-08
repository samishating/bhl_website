'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { FaYoutube, FaGamepad, FaVideo, FaMusic, FaRunning, FaShieldAlt, FaPlay } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

const DIVISION_ICONS: Record<string, ReactNode> = {
  gaming: <FaGamepad />,
  gaming_creator: <FaGamepad />,
  content: <FaVideo />,
  content_creator: <FaVideo />,
  music: <FaMusic />,
  music_creator: <FaMusic />,
  sport: <FaRunning />,
  sport_creator: <FaRunning />,
  staff: <FaShieldAlt />,
};

interface Video {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
  isFeatured: boolean;
}

interface Creator {
  username: string;
  creatorDisplayName: string;
  avatar: string;
  divisions: string[];
}

interface VideoGroup {
  creator: Creator;
  videos: Video[];
}

export default function CreatorVideoCarousel({ groups }: { groups: VideoGroup[] }) {
  // Only include groups that actually have videos
  const validGroups = groups.filter(g => g.videos && g.videos.length > 0);

  const [creatorIndex, setCreatorIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const CYCLE_DURATION = 15000; // 15 seconds per creator

  const handleNextCreator = useCallback(() => {
    setCreatorIndex((prev) => (prev + 1) % validGroups.length);
    setVideoIndex(0);
    setProgress(0);
  }, [validGroups.length]);

  const handlePrevCreator = useCallback(() => {
    setCreatorIndex((prev) => (prev === 0 ? validGroups.length - 1 : prev - 1));
    setVideoIndex(0);
    setProgress(0);
  }, [validGroups.length]);

  // Auto-cycle through creators
  useEffect(() => {
    if (validGroups.length <= 1) return;
    if (isHovered) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }
    const intervalStep = 50;
    const progressPerStep = (intervalStep / CYCLE_DURATION) * 100;
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNextCreator();
          return 0;
        }
        return prev + progressPerStep;
      });
    }, intervalStep);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [creatorIndex, handleNextCreator, isHovered, validGroups.length]);

  // Scroll filmstrip to active video card
  useEffect(() => {
    if (!filmstripRef.current) return;
    const cards = filmstripRef.current.querySelectorAll<HTMLElement>('[data-video-card]');
    if (cards[videoIndex]) {
      cards[videoIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [videoIndex]);

  if (!validGroups || validGroups.length === 0) return null;

  const currentGroup = validGroups[creatorIndex];
  const { creator, videos } = currentGroup;
  const activeVideo = videos[videoIndex];

  return (
    <div
      className={styles.carouselContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Creator Header Row */}
      <div className={styles.carouselHeader}>
        <div className={styles.carouselCreatorInfo}>
          <div className={styles.carouselAvatar}>
            {creator.avatar
              ? <img src={creator.avatar} alt={creator.username} />
              : creator.username[0].toUpperCase()
            }
          </div>
          <div className={styles.carouselCreatorText}>
            <div className={styles.carouselCreatorName}>{creator.creatorDisplayName || creator.username}</div>
            <div className={styles.carouselCreatorSubtitle}>Now Showing</div>
          </div>
        </div>

        {validGroups.length > 1 && (
          <div className={styles.carouselControls}>
            <div className={styles.carouselTimer}>
              <motion.div
                className={styles.carouselTimerBar}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: isHovered ? 0 : 0.05, ease: 'linear' }}
              />
              {isHovered && <Pause size={14} className={styles.pauseIcon} />}
            </div>
            <button onClick={handlePrevCreator} className={styles.carouselBtn} aria-label="Previous creator" title="Previous creator">
              <ChevronLeft size={20} />
            </button>
            <span className={styles.carouselCounter}>{creatorIndex + 1} / {validGroups.length}</span>
            <button onClick={handleNextCreator} className={styles.carouselBtn} aria-label="Next creator" title="Next creator">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Video Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={creatorIndex}
          className={styles.videoCarouselLayout}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Featured Preview (active video) */}
          <motion.a
            href={activeVideo.videoUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.videoFeatured}
            whileHover={{ scale: 1.01 }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={videoIndex}
                src={activeVideo.thumbnailUrl}
                alt={activeVideo.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            <div className={styles.videoFeaturedOverlay}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div className={styles.divisionBadge} style={{ width: '44px', height: '44px' }}>
                  {creator.divisions && creator.divisions.length > 0
                    ? (DIVISION_ICONS[creator.divisions[0]] || <FaShieldAlt />)
                    : <FaShieldAlt />}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{creator.creatorDisplayName || creator.username}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <FaYoutube style={{ color: '#ff0000' }} />
                    {new Date(activeVideo.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={styles.videoFeaturedTitle}>{activeVideo.title}</div>
              {/* Video index dots */}
              {videos.length > 1 && (
                <div className={styles.videoDots}>
                  {videos.map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.videoDot} ${i === videoIndex ? styles.videoDotActive : ''}`}
                      onClick={(e) => { e.preventDefault(); setVideoIndex(i); }}
                      aria-label={`Video ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Play icon overlay */}
            <div className={styles.featuredPlayOverlay}>
              <div className={styles.featuredPlayIcon}><FaPlay /></div>
            </div>
          </motion.a>

          {/* Filmstrip Rail (5 videos) */}
          <div className={styles.filmstripWrapper}>
            <button
              className={styles.filmstripNavBtn}
              onClick={() => setVideoIndex(prev => Math.max(0, prev - 1))}
              disabled={videoIndex === 0}
              aria-label="Previous video"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.filmstrip} ref={filmstripRef}>
              {videos.map((v, idx) => (
                <button
                  key={v.videoId}
                  data-video-card="true"
                  className={`${styles.filmstripCard} ${idx === videoIndex ? styles.filmstripCardActive : ''}`}
                  onClick={() => setVideoIndex(idx)}
                  aria-label={`Select video: ${v.title}`}
                >
                  <div className={styles.filmstripThumb}>
                    <img src={v.thumbnailUrl} alt={v.title} />
                    {idx === videoIndex && (
                      <motion.div
                        layoutId={`filmstrip-active-${creatorIndex}`}
                        className={styles.filmstripActiveGlow}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <div className={styles.filmstripPlayOverlay}>
                      <FaPlay size={12} />
                    </div>
                  </div>
                  <div className={styles.filmstripMeta}>
                    <div className={styles.filmstripTitle}>{v.title}</div>
                    <div className={styles.filmstripDate}>
                      <FaYoutube style={{ color: '#ff0000', flexShrink: 0 }} />
                      {new Date(v.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              className={styles.filmstripNavBtn}
              onClick={() => setVideoIndex(prev => Math.min(videos.length - 1, prev + 1))}
              disabled={videoIndex === videos.length - 1}
              aria-label="Next video"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
