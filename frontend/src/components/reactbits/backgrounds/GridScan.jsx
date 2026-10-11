'use client';

import React from 'react';

/**
 * React Bits GridScan - High-performance technical grid scanner
 * Calibrated specifically for developer workspace precision.
 * Renders subtle animated scanner beam & cyan/violet radial glows without WebGL overhead or camera prompts.
 */
export default function GridScan({ className = '', scanLine = true }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Precision developer grid pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Atmospheric radial glow fields */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle 800px at 50% -10%, rgba(99, 230, 255, 0.07), transparent 70%)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle 600px at 85% 65%, rgba(139, 124, 255, 0.05), transparent 70%)'
        }}
      />

      {/* Compiler scanner beam */}
      {scanLine && (
        <div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60 animate-[scanBeam_8s_ease-in-out_infinite]"
          style={{
            boxShadow: '0 0 16px rgba(99, 230, 255, 0.4)'
          }}
        />
      )}
    </div>
  );
}
