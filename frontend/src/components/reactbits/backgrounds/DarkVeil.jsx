'use client';

import React from 'react';

/**
 * React Bits DarkVeil - Deep technical ambient background
 */
export default function DarkVeil({ className = '', children }) {
  return (
    <div className={`relative w-full h-full bg-[#05070A] ${className}`}>
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 230, 255, 0.08), transparent 80%)'
        }}
      />
      {children}
    </div>
  );
}
