'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import AnimatedCounter from './AnimatedCounter';
import styles from '@/app/(main)/page.module.css';

interface HeroThreeProps {
  statsData: {
    members: number;
    xp: number;
  };
}

export default function HeroThree({ statsData }: HeroThreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- OBJECTS ---
    // Particles
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const colorChoices = [
      new THREE.Color('#FF0000'),
      new THREE.Color('#FFFDBA'),
      new THREE.Color('#A855F7'),
      new THREE.Color('#06B6D4')
    ];

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Floating Torus (Tactical Halo)
    const torusGeometry = new THREE.TorusGeometry(3, 0.01, 16, 100);
    const torusMaterial = new THREE.MeshBasicMaterial({ color: '#FF0000', transparent: true, opacity: 0.2 });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.rotation.x = Math.PI / 2;
    scene.add(torus);

    camera.position.z = 5;

    // --- INTERACTION ---
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION ---
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      particles.rotation.y = elapsedTime * 0.05;
      particles.rotation.x = elapsedTime * 0.02;

      // Mouse following effect
      particles.position.x += (mouseX * 0.5 - particles.position.x) * 0.05;
      particles.position.y += (mouseY * 0.5 - particles.position.y) * 0.05;

      torus.rotation.z = elapsedTime * 0.1;
      torus.scale.setScalar(1 + Math.sin(elapsedTime) * 0.05);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // --- RESIZE ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <section className={styles.hero}>
      <div ref={containerRef} className={styles.canvas} />
      <div className={styles.heroGlow} />
      <div className={styles.heroContent}>
        <div className={styles.heroPill}>
          <span className={styles.pillDot} />
          3D IMMERSIVE EXPERIENCE
        </div>
        <h1 className={styles.heroTitle}>
          <span className="gradient-text">Rise.</span>{' '}
          <span className="gradient-text-red">Compete.</span>{' '}
          <span className={styles.heroWord}>Dominate.</span>
        </h1>
        <p className={styles.heroSub}>
          Brotherhood Legacy in the next dimension. Join the most elite multi-domain community and build your 3D legacy.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/register" className="btn btn-primary btn-lg">
            Join the Brotherhood
          </Link>
          <Link href="/divisions" className="btn btn-secondary btn-lg">
            Explore Divisions
          </Link>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <AnimatedCounter value={statsData.members} suffix="+" />
            </span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>4</span>
            <span className={styles.statLabel}>Divisions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <AnimatedCounter value={statsData.xp} suffix="+" />
            </span>
            <span className={styles.statLabel}>XP Earned</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>∞</span>
            <span className={styles.statLabel}>Potential</span>
          </div>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <span>Scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
