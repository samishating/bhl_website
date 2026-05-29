'use client';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { FaYoutube, FaTwitch } from 'react-icons/fa';
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
    <div className={styles.carouselContainer} style={{ marginBottom: '40px' }}>
      <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="section-tag" style={{ margin: 0, background: 'rgba(255, 0, 0, 0.1)', color: '#FF4444', border: '1px solid rgba(255, 0, 0, 0.25)' }}>
              LIVE NOW
            </span>
            <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ON <span style={{ color: '#a970ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaTwitch /> TWITCH</span>
            </h2>
          </div>
          <p className={styles.sectionSubtitle}>Support brotherhood creators streaming live right now</p>
        </div>
      </div>

      <motion.div 
        className={styles.creatorScroll}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {streams.map((stream) => (
          <motion.div 
            key={stream.creatorId} 
            variants={fadeUp} 
            className={styles.creatorItem}
            style={{ flex: '0 0 380px' }}
          >
            <a 
              href={stream.url} 
              target="_blank" 
              rel="noreferrer" 
              className={styles.creatorCard}
              style={{
                border: '1px solid rgba(169, 112, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(169, 112, 255, 0.05)',
              }}
            >
              {/* Thumbnail Container */}
              <div className={styles.cardImage} style={{ aspectRatio: '16/9' }}>
                <img 
                  src={stream.thumbnail} 
                  alt={`${stream.displayName} live stream`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Overlay Tags */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
                  <span style={{
                    background: '#FF0000',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.1em',
                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                    LIVE
                  </span>
                  
                  <span style={{
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    👁️ {stream.viewers.toLocaleString()}
                  </span>
                </div>

                <div className={styles.cardOverlay} />
              </div>

              {/* Card Footer Content */}
              <div className={styles.cardContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '12px', padding: '16px 20px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Category game badge */}
                  <span style={{
                    background: 'rgba(169, 112, 255, 0.08)',
                    border: '1px solid rgba(169, 112, 255, 0.25)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#c29eff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                  }}>
                    {stream.game}
                  </span>
                </div>

                {/* Stream title and creator name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    fontFamily: 'Rajdhani',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: '#fff',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {stream.displayName}
                  </div>
                  
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    height: '2.8em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {stream.title}
                  </div>
                </div>

                {/* Watch Button */}
                <div style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(169, 112, 255, 0.1)',
                  border: '1px solid rgba(169, 112, 255, 0.25)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 10px rgba(169, 112, 255, 0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#a970ff';
                  e.currentTarget.style.borderColor = '#a970ff';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(169, 112, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(169, 112, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(169, 112, 255, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(169, 112, 255, 0.02)';
                }}
                >
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
