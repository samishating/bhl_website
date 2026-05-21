'use client';
import { useState, useEffect, useRef } from 'react';
import { FaYoutube, FaGamepad, FaVideo, FaMusic, FaRunning, FaShieldAlt } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, scaleIn } from '@/lib/animations';
import styles from './page.module.css';

const DIVISION_ICONS: Record<string, any> = {
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const CYCLE_DURATION = 15000; // 15 seconds

  // Handle auto-cycling logic
  useEffect(() => {
    if (groups.length <= 1) return; // Don't cycle if only 1 group
    
    if (isHovered) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50; // Update progress every 50ms for smooth bar
    const progressPerStep = (intervalStep / CYCLE_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + progressPerStep;
      });
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeIndex, isHovered, groups.length]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % groups.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? groups.length - 1 : prev - 1));
    setProgress(0);
  };

  if (!groups || groups.length === 0) return null;

  const currentGroup = groups[activeIndex];
  const { creator, videos } = currentGroup;

  const firstVideo = videos[0];
  const remainingVideos = videos.slice(1, 5);

  return (
    <div 
      className={styles.carouselContainer} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Controls & Creator Header */}
      <div className={styles.carouselHeader}>
        <div className={styles.carouselCreatorInfo}>
          <div className={styles.carouselAvatar}>
            {creator.avatar ? <img src={creator.avatar} alt={creator.username} /> : creator.username[0]}
          </div>
          <div className={styles.carouselCreatorText}>
            <div className={styles.carouselCreatorName}>
              {creator.creatorDisplayName}
            </div>
            <div className={styles.carouselCreatorSubtitle}>
              Now Showing
            </div>
          </div>
        </div>

        {groups.length > 1 && (
          <div className={styles.carouselControls}>
            <div className={styles.carouselTimer}>
              <motion.div 
                className={styles.carouselTimerBar} 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: isHovered ? 0 : 0.05, ease: "linear" }}
              />
              {isHovered && <Pause size={14} className={styles.pauseIcon} />}
            </div>
            <button onClick={handlePrev} className={styles.carouselBtn}><ChevronLeft size={20} /></button>
            <span className={styles.carouselCounter}>{activeIndex + 1} / {groups.length}</span>
            <button onClick={handleNext} className={styles.carouselBtn}><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeIndex}
          className={styles.videoCarouselLayout}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Featured Large Card (First Video) */}
          <motion.a 
            href={firstVideo.videoUrl} 
            target="_blank" 
            rel="noreferrer" 
            className={styles.videoFeatured}
            whileHover={{ scale: 1.01 }}
          >
            <img src={firstVideo.thumbnailUrl} alt={firstVideo.title} />
            <div className={styles.videoFeaturedOverlay}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div className={styles.divisionBadge} style={{ width: '48px', height: '48px' }}>
                  {creator.divisions && creator.divisions.length > 0 
                    ? (DIVISION_ICONS[creator.divisions[0]] || <FaShieldAlt />)
                    : <FaShieldAlt />}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{creator.creatorDisplayName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FaYoutube style={{ color: '#ff0000', fontSize: '1rem' }} />
                    {new Date(firstVideo.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={styles.videoFeaturedTitle}>{firstVideo.title}</div>
            </div>
          </motion.a>

          {/* Grid of Remaining Videos (Up to 4) */}
          {remainingVideos.length > 0 && (
            <div className={styles.videoGrid}>
              {remainingVideos.map((v, idx) => (
                <motion.div 
                  key={idx} 
                  className={styles.contentCard} 
                  style={{ display: 'flex', flexDirection: 'column' }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className={styles.contentThumb}>
                    <img src={v.thumbnailUrl} alt={v.title} />
                    <div className={styles.playOverlay}>
                      <div className={styles.playIcon} style={{ width: '40px', height: '40px', fontSize: '1rem' }}>▶</div>
                    </div>
                  </div>
                  <div className={styles.contentMeta} style={{ flex: 1 }}>
                    <div className={styles.contentAvatar}>
                      {creator.avatar ? <img src={creator.avatar} alt={creator.username} /> : creator.username[0]}
                    </div>
                    <div className={styles.contentText}>
                      <div className={styles.contentTitle}>{v.title}</div>
                      <div className={styles.contentAuthor} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <FaYoutube style={{ color: '#ff0000' }} />
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <a href={v.videoUrl} target="_blank" rel="noreferrer" className={styles.fullLink} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
