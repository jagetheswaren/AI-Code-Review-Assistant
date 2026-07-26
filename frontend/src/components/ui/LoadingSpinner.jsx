import React from 'react';
import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-[#2563EB] border-t-transparent rounded-full animate-spin', sizes[size])} />
    </div>
  );
};

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  </div>
);
