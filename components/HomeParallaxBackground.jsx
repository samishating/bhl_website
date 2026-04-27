'use client';
import { useEffect, useRef } from 'react';

export default function HomeParallaxBackground() {
  const containerRef = useRef(null);
  const blurRef = useRef(null);
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const noiseRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // --- PARALLAX ENGINE ---
    let ticking = false;

    const updateParallax = () => {
      const y = window.scrollY;
      
      if (blurRef.current) {
        blurRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.08)`;
      }
      if (mainRef.current) {
        mainRef.current.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
      }
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
      }
      if (noiseRef.current) {
        noiseRef.current.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    // --- PARTICLE SYSTEM ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const isMobile = width <= 768;
    const particleCount = isMobile ? 30 : 60;
    const particles = [];
    const colors = ['#FF0000', '#FFFDBA', '#FFFFFF'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.5 - 0.1, // Slow upward drift
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.35 + 0.15
      });
    }

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const color = p.color === '#FF0000' ? `rgba(255, 0, 0, ${p.opacity})` : 
                      p.color === '#FFFDBA' ? `rgba(255, 253, 186, ${p.opacity})` : 
                      `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillStyle = color;
        ctx.fill();
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="home-parallax-bg" ref={containerRef}>
      <div className="bg-layer bg-blur" ref={blurRef}></div>
      <div className="bg-layer bg-main" ref={mainRef}></div>
      <div className="bg-layer bg-overlay" ref={overlayRef}></div>
      <div className="bg-layer bg-noise" ref={noiseRef}></div>
      <canvas className="bg-particles" ref={canvasRef}></canvas>
    </div>
  );
}
