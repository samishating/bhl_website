'use client';
import Image from 'next/image';

export default function LoadingScreen({ message = 'Initializing Legacy...' }: { message?: string }) {
  return (
    <div className="loading-screen-fixed">
      <div className="loader-container">
        <div className="loader-visual">
          <div className="loader-arc-bg" />
          <div className="loader-arc" />
          <Image 
            src="/brand/logo.webp" 
            alt="BHL" 
            width={70} 
            height={70} 
            className="loader-logo"
            priority 
          />
        </div>
        {message && <div className="loader-text">{message}</div>}
      </div>
    </div>
  );
}
