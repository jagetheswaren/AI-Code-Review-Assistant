import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, type, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-subtle">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/[0.08] bg-[#090D13] px-3 py-2 text-sm text-content shadow-sm transition-all placeholder:text-content-subtle focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
          Icon && "pl-9",
          error && "border-danger focus-visible:border-danger focus-visible:ring-danger/40",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-white/[0.08] bg-[#090D13] px-3 py-2.5 text-sm text-content shadow-sm transition-all placeholder:text-content-subtle focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 font-mono",
          error && "border-danger focus-visible:border-danger focus-visible:ring-danger/40",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef(({ className, options, children, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#090D13] px-3 py-2 text-sm text-content shadow-sm transition-all focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus-visible:border-danger",
          className
        )}
        ref={ref}
        {...props}
      >
        {options ? options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0D131C] text-content">
            {opt.label || opt.value}
          </option>
        )) : children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-content-subtle">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
});
Select.displayName = "Select";
