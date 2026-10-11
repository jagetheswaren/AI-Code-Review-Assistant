'use client';

import React from 'react';

/**
 * React Bits Stepper - Review pipeline stage indicator
 * Renders pipeline architecture: Security -> Quality -> Complexity -> Performance -> ML -> AI
 */
export function Stepper({ steps = [], activeStep = 0, className = '' }) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto py-2 ${className}`}>
      {steps.map((step, idx) => {
        const isPast = idx < activeStep;
        const isCurrent = idx === activeStep;
        return (
          <div key={idx} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                isCurrent
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : isPast
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-white/[0.03] text-content-subtle border border-white/[0.05]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-primary animate-pulse' : isPast ? 'bg-success' : 'bg-white/30'}`} />
              <span>{step}</span>
            </div>
            {idx < steps.length - 1 && <span className="text-white/20 text-xs select-none">→</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * React Bits GlassSurface - Frosted glass panel
 */
export function GlassSurface({ children, className = '' }) {
  return (
    <div className={`glass-panel rounded-xl shadow-elevated border border-white/[0.08] bg-[#0D131C]/80 backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

export default Stepper;
