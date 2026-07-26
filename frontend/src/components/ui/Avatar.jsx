import React from 'react';
import { cn } from '../../lib/utils';

export const Avatar = ({ src, alt, fallback, size = 'md', className }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  return (
    <div className={cn('relative shrink-0 rounded-full overflow-hidden', sizes[size], className)}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-bold">
          {fallback || '?'}
        </div>
      )}
    </div>
  );
};
