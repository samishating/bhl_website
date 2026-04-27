'use client';
import { useEffect, useRef } from 'react';

export default function HomeFixedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // --- OPTIONAL PARTICLE SYSTEM (FIXED) ---
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
        vy: -Math.random() * 0.4 - 0.1, // Very slow upward drift
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.3 + 0.1
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div className="home-fixed-bg" />
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: -5, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none' 
        }} 
      />
    </>
  );
}
