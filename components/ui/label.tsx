import * as React from 'react';
import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'font-[family-name:var(--font-rajdhani)] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]',
        className
      )}
      {...props}
    />
  );
}

export { Label };
