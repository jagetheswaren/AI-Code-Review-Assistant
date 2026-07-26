import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const Tooltip = ({ children, content, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && content && (
        <div className={cn('absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[#1E293B] border border-white/[0.06] text-xs text-white whitespace-nowrap shadow-xl z-50', className)}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#1E293B]" />
        </div>
      )}
    </div>
  );
};
