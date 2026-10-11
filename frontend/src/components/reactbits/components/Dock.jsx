'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import './Dock.css';

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  isActive
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${isActive ? 'dock-item-active border-primary/40 bg-primary/10 text-primary' : ''} ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {children}
    </motion.div>
  );
}

function DockLabel({ children, isHovered, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items = [],
  activePath = '',
  onNavigate,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 58,
  distance = 140,
  panelHeight = 60,
  dockHeight = 100,
  baseItemSize = 44
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + 12),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel border border-white/[0.12] bg-[#090D13]/95 backdrop-blur-md shadow-2xl ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => {
          const isActive = activePath === item.path;
          const handleClick = () => {
            if (item.onClick) item.onClick();
            else if (onNavigate && item.path) onNavigate(item.path);
          };

          // Handle Icon whether it is a Component or JSX Element
          const IconComponent = item.icon;
          const renderedIcon = isValidElement(item.icon) ? (
            item.icon
          ) : IconComponent ? (
            <IconComponent className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-content-muted'}`} />
          ) : null;

          return (
            <DockItem
              key={item.path || index}
              onClick={handleClick}
              className={item.className}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              label={item.label}
              isActive={isActive}
            >
              <DockIcon>{renderedIcon}</DockIcon>
              {item.label && <DockLabel>{item.label}</DockLabel>}
            </DockItem>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
