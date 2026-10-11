import React from 'react';
import { cn } from '../../lib/utils';
import { Bot, Code2, Shield, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-brand border-t-transparent border-l-transparent rounded-full animate-spin', sizes[size])} />
    </div>
  );
};

export const PageLoader = ({ text = 'Analyzing context...' }) => {
  const [currentIcon, setCurrentIcon] = React.useState(0);
  const icons = [Code2, Shield, Search, Zap, Bot];
  const messages = [
    "Parsing Abstract Syntax Tree...",
    "Scanning for common vulnerabilities...",
    "Detecting code anti-patterns...",
    "Evaluating performance impact...",
    "Consulting LLM models..."
  ];
  const Icon = icons[currentIcon];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [icons.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-background animate-normal-in">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-surface-border border-t-brand border-r-brand/50 shadow-[0_0_15px_rgba(var(--color-brand),0.3)]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-2 rounded-full bg-surface-elevated flex items-center justify-center border border-surface-border"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIcon}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-8 h-8 text-brand" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      
      <h3 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">{text}</h3>
      
      <div className="h-6 relative overflow-hidden flex items-center justify-center w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIcon}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-content-muted font-mono bg-surface-elevated px-3 py-1 rounded-sm border border-surface-border"
          >
            {messages[currentIcon]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
