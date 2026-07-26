import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-white/10 text-slate-300 border-white/[0.06]',
  primary: 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export const Badge = ({ variant = 'default', className, children, dot, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}
    {...props}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
      'bg-emerald-400': variant === 'success',
      'bg-amber-400': variant === 'warning',
      'bg-red-400': variant === 'danger',
      'bg-[#60A5FA]': variant === 'primary',
      'bg-purple-400': variant === 'purple',
      'bg-slate-400': variant === 'default',
    })} />}
    {children}
  </span>
);
