'use client';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT = 'https://www.instagram.com/embed.js';

let scriptPromise: Promise<void> | null = null;

/**
 * Loads Instagram's embed.js once per page, no matter how many embeds mount.
 * This is the public embed script — it needs no access token and no Meta app.
 */
function loadEmbedScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.instgrm) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('embed.js failed')));
      if (window.instgrm) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = EMBED_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('embed.js failed'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

interface InstagramEmbedProps {
  postUrl: string;
  /** Rendered instead of the embed if Instagram's script can't load (blocked, offline). */
  fallbackLabel?: string;
}

/**
 * Renders the genuine Instagram post embed — Instagram's own markup, rendered by
 * Instagram's own script, so it looks exactly like a native post rather than a
 * hand-built card (spec §6).
 */
export default function InstagramEmbed({ postUrl, fallbackLabel = 'View this post on Instagram' }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadEmbedScript()
      .then(() => {
        if (cancelled) return;
        // process() converts every unprocessed blockquote on the page into the real embed.
        window.instgrm?.Embeds.process();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [postUrl]);

  if (failed) {
    return (
      <a href={postUrl} target="_blank" rel="noopener noreferrer" className="ig-embed-fallback">
        {fallbackLabel}
      </a>
    );
  }

  return (
    <div ref={containerRef} className="ig-embed-host">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{ background: '#FFF', border: 0, margin: 0, maxWidth: '540px', width: '100%', padding: 0 }}
      >
        <a href={postUrl} target="_blank" rel="noopener noreferrer">{fallbackLabel}</a>
      </blockquote>
    </div>
  );
}
