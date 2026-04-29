import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex min-h-[52px] flex-wrap items-center justify-center gap-1 rounded-full border border-[rgba(255,0,0,0.22)] bg-[rgba(12,12,12,0.76)] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex min-h-10 min-w-[90px] items-center justify-center rounded-full border border-transparent px-4 py-2 font-[family-name:var(--font-rajdhani)] text-[1.02rem] font-semibold uppercase tracking-[0.09em] text-[var(--text-secondary)] transition-all duration-300 hover:text-white data-[state=active]:border-[rgba(255,0,0,0.45)] data-[state=active]:bg-[linear-gradient(135deg,rgba(255,0,0,0.34),rgba(170,0,0,0.22))] data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_rgba(255,0,0,0.28)]',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn('mt-6', className)} {...props} />);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
