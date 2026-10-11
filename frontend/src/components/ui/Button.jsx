import React from 'react';
import { cn } from '../../lib/utils';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  children,
  ...props
}) {
  const isBusy = isLoading || loading;
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none';
  
  const variants = {
    primary: 'bg-primary text-[#05070A] font-semibold hover:bg-cyan-glow hover:shadow-cyanGlow active:scale-[0.98]',
    secondary: 'bg-[#121A25] text-content hover:bg-[#171E29] border border-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]',
    outline: 'border border-primary/40 bg-transparent hover:bg-primary/10 text-primary active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-content-muted hover:text-content',
    danger: 'bg-danger text-white hover:bg-red-600 active:scale-[0.98]',
    violet: 'bg-secondary text-white hover:bg-violet-glow hover:shadow-violetGlow active:scale-[0.98]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2.5',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isBusy || props.disabled}
      {...props}
    >
      {isBusy ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}
