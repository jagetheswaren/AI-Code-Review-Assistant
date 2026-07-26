import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const TabsContext = createContext();

export const Tabs = ({ defaultValue, children, className }) => {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children }) => (
  <div className={cn('flex gap-1 p-1 rounded-xl bg-white/5 border border-white/[0.06]', className)}>{children}</div>
);

export const TabsTrigger = ({ value, children, className }) => {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tab-bg"
          className="absolute inset-0 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg"
          transition={{ type: 'spring', duration: 0.3 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent = ({ value, children, className }) => {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={cn('mt-4', className)}>{children}</div>;
};
