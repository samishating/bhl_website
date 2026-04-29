import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-[var(--text-muted)] focus:border-[var(--brand-red)] focus:bg-[rgba(255,0,0,0.02)] focus:shadow-[0_0_0_2px_rgba(255,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
