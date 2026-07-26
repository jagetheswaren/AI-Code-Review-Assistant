import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, hover, ...props }) => (
  <motion.div
    whileHover={hover ? { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' } : undefined}
    className={cn(
      'rounded-xl bg-[#111827] border border-white/[0.06] p-6 transition-all duration-200',
      hover && 'cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('flex items-center justify-between mb-4', className)} {...props}>{children}</div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>{children}</h3>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>{children}</div>
);
