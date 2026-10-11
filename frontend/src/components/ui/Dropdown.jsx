import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Dropdown = ({ trigger, items = [], align = 'right', className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                'absolute z-50 mt-2 min-w-[180px] bg-surface border border-surface-border rounded-md shadow-dropdown py-1 overflow-hidden',
                align === 'right' ? 'right-0' : 'left-0',
                className
              )}
            >
              {items.map((item, i) => (
                item.separator ? (
                  <div key={i} className="border-t border-surface-border my-1" />
                ) : (
                  <button
                    key={i}
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors',
                      item.danger ? 'text-critical hover:bg-critical/10' : 'text-content-muted hover:bg-surface-elevated hover:text-content'
                    )}
                  >
                    {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                    {item.label}
                  </button>
                )
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
