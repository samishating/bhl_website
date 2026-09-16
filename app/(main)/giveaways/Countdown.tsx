'use client';
import { useSyncExternalStore } from 'react';
import styles from './page.module.css';

/** One shared 1s tick for every countdown on the page. */
function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

const getSnapshot = () => Math.floor(Date.now() / 1000);
// The server has no clock the client can agree with, so it renders a placeholder
// and the real value swaps in after hydration — no mismatch either way.
const getServerSnapshot = () => null;

function remaining(endDate: string, nowSeconds: number) {
  const diff = new Date(endDate).getTime() - nowSeconds * 1000;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Live countdown while a giveaway is still accepting entries (spec §3). */
export default function Countdown({ endDate }: { endDate: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === null) return <span className={styles.countdown} aria-hidden="true" />;

  const left = remaining(endDate, now);
  if (!left) return <span className={styles.endedLabel}>Entries closed</span>;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className={styles.countdown}>
      <span className={styles.countdownLabel}>Closes in</span>
      <time dateTime={endDate} className={styles.countdownValue}>
        {left.days > 0 && `${left.days}d `}
        {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
      </time>
    </span>
  );
}
