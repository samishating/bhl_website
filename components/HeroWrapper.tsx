'use client';
import dynamic from 'next/dynamic';

const HeroThree = dynamic(() => import('./HeroThree'), { ssr: false });

interface HeroWrapperProps {
  statsData: {
    members: number;
    xp: number;
  };
}

export default function HeroWrapper({ statsData }: HeroWrapperProps) {
  return <HeroThree statsData={statsData} />;
}
