'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap/dist/gsap';
import SpotlightCard from './SpotlightCard';
import './MagicBento.css';

/**
 * React Bits MagicBento - High-performance bento card component
 * Offers 3D tilt, spotlight tracking, badge tags, and click ripples.
 */
export default function MagicBento({
  title,
  description,
  badge,
  icon: Icon,
  span = 'col-span-1',
  className = '',
  spotlightColor = 'rgba(99, 230, 255, 0.09)',
  enableTilt = true,
  children
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !enableTilt) return;

    const onMouseMove = e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(el, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enableTilt]);

  return (
    <div ref={cardRef} className={`transition-transform duration-200 ${span}`}>
      <SpotlightCard
        spotlightColor={spotlightColor}
        className={`flex flex-col justify-between p-6 sm:p-7 h-full ${className}`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            {Icon && (
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-primary">
                <Icon className="w-5 h-5" />
              </div>
            )}
            {badge && (
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-content mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-content-muted leading-relaxed">
            {description}
          </p>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </SpotlightCard>
    </div>
  );
}
