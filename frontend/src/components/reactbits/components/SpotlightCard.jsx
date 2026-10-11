'use client';

import { useRef } from 'react';
import './SpotlightCard.css';

/**
 * React Bits SpotlightCard - Official implementation
 * Tracks mouse position without triggering React re-renders via CSS custom properties.
 */
const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(99, 230, 255, 0.08)',
  onClick,
  ...props
}) => {
  const divRef = useRef(null);

  const handleMouseMove = e => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`card-spotlight ${className}`}
      {...props}
    >
      <div className="card-spotlight-content w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
