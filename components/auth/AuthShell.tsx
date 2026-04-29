import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface AuthShellProps {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export default function AuthShell({ title, subtitle, children, footer, maxWidthClassName = 'max-w-[460px]' }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,0,0,0.14)_0%,transparent_65%)]" />

      <Card className={`relative w-full border-[rgba(255,0,0,0.18)] bg-[rgba(18,18,18,0.94)] shadow-[0_0_60px_rgba(255,0,0,0.1)] backdrop-blur-xl ${maxWidthClassName}`}>
        <CardContent className="px-8 pb-8 pt-7 sm:px-10 sm:pb-9 sm:pt-8">
          <Link href="/" className="mb-6 flex justify-center">
            <Image src="/brand/logo.png" alt="BHL" width={180} height={60} style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          <div className="mb-7 text-center">
            <h2 className="text-3xl font-bold uppercase tracking-[0.06em] sm:text-[3.2rem]">{title}</h2>
            <p className="mt-2 text-[1.05rem] text-[var(--text-secondary)]">{subtitle}</p>
          </div>

          {children}

          {footer ? (
            <div className="mt-8 border-t border-[rgba(255,255,255,0.06)] pt-4 text-center text-base leading-relaxed text-[var(--text-muted)]">
              {footer}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
