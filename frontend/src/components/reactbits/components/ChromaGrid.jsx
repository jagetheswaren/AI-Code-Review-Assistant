'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap/dist/gsap';
import './ChromaGrid.css';

/**
 * React Bits ChromaGrid - Official implementation
 * Dynamic spotlight grid with GSAP quickSetter and chroma mask effects.
 */
export const ChromaGrid = ({
  items = [],
  className = '',
  radius = 280,
  columns = 3,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out'
}) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      }
    });
  };

  const handlePointerMove = e => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    moveTo(e.clientX - rect.left, e.clientY - rect.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: 'auto' });
  };

  const handlePointerLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: 'auto'
    });
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`chroma-grid ${className}`}
      style={{
        '--r': `${radius}px`,
        '--cols': columns
      }}
    >
      {items.map((item, idx) => {
        // If item is already a React element
        if (typeof item === 'object' && item !== null && !('title' in item && 'subtitle' in item)) {
          return (
            <div key={idx} className="chroma-card">
              {item}
            </div>
          );
        }

        // Standard chroma card data
        return (
          <div
            key={idx}
            className="chroma-card"
            style={{
              '--card-border': item.borderColor || 'rgba(99, 230, 255, 0.4)',
              '--card-gradient': item.gradient || 'linear-gradient(145deg, #0D131C, #05070A)'
            }}
          >
            {item.image && (
              <div className="chroma-img-wrapper">
                <img src={item.image} alt={item.title} loading="lazy" />
              </div>
            )}
            <div className="chroma-info">
              <div>
                <h4 className="font-semibold text-sm text-content">{item.title}</h4>
                <p className="role text-xs text-content-muted">{item.subtitle}</p>
              </div>
              {item.handle && <span className="handle text-xs font-mono text-primary">{item.handle}</span>}
            </div>
          </div>
        );
      })}
      <div className="chroma-overlay" />
      <div ref={fadeRef} className="chroma-fade" />
    </div>
  );
};

export default ChromaGrid;
