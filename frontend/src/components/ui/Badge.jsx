import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-white/[0.04] text-content border border-white/[0.08]',
    critical: 'bg-danger/10 text-danger border border-danger/25 shadow-[0_0_10px_rgba(255,93,103,0.15)]',
    high: 'bg-high/10 text-[#FF944D] border border-[#FF944D]/25',
    medium: 'bg-medium/10 text-warning border border-warning/25',
    low: 'bg-low/10 text-primary border border-primary/25',
    success: 'bg-success/10 text-success border border-success/25',
    info: 'bg-primary/10 text-primary border border-primary/25',
    cyan: 'bg-primary/10 text-primary border border-primary/25',
    violet: 'bg-secondary/10 text-secondary border border-secondary/25',
    outline: 'text-content border border-white/[0.12] bg-transparent',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
