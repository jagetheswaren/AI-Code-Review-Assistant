import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-[#2563EB]/25 hover:shadow-[#2563EB]/40',
  secondary: 'bg-white/5 text-slate-300 border border-white/[0.06] hover:bg-white/10 hover:text-white',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
  outline: 'border border-white/[0.06] text-slate-300 hover:bg-white/5 hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  xl: 'px-8 py-4 text-lg gap-3',
};

export const Button = React.forwardRef(({ variant = 'primary', size = 'md', className, children, loading, disabled, ...props }, ref) => (
  <motion.button
    ref={ref}
    whileHover={{ scale: disabled ? 1 : 1.01 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    className={cn(
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
      variants[variant],
      sizes[size],
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
    {children}
  </motion.button>
));
Button.displayName = 'Button';
