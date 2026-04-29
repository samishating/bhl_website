import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-[family-name:var(--font-rajdhani)] text-sm font-semibold uppercase tracking-[0.16em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-[var(--brand-red)] text-white shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:-translate-y-0.5 hover:bg-[var(--brand-red-dark)] hover:shadow-[0_0_35px_rgba(255,0,0,0.45),0_0_60px_rgba(255,0,0,0.2)]',
        secondary:
          'border-[var(--brand-red)] bg-transparent text-[var(--brand-red)] shadow-[inset_0_0_15px_rgba(255,0,0,0.04)] hover:-translate-y-0.5 hover:bg-[rgba(255,0,0,0.08)] hover:shadow-[var(--glow-red)]',
        ghost:
          'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] hover:bg-[rgba(255,0,0,0.06)] hover:text-white hover:border-[var(--border-hover)]',
        danger:
          'border-[var(--brand-red)] bg-[var(--brand-red-deep)] text-white hover:-translate-y-0.5 hover:bg-[var(--brand-red)] hover:shadow-[var(--glow-red)]',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
