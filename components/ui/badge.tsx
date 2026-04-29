import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-1 font-[family-name:var(--font-rajdhani)] text-[11px] font-semibold uppercase tracking-[0.14em]',
  {
    variants: {
      variant: {
        primary: 'border-[rgba(255,0,0,0.35)] bg-[rgba(255,0,0,0.12)] text-[var(--brand-red)]',
        violet: 'border-[rgba(204,0,0,0.3)] bg-[rgba(204,0,0,0.12)] text-[#ff7373]',
        gold: 'border-[rgba(255,253,186,0.35)] bg-[rgba(255,253,186,0.12)] text-[var(--cream)]',
        green: 'border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.12)] text-[#22c55e]',
        outline: 'border-[rgba(255,255,255,0.16)] bg-transparent text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
