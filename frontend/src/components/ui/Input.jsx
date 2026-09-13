import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
      <input
        ref={ref}
        className={cn(
          'w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20',
          Icon && 'pl-10',
          error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20 resize-none',
        error && 'border-red-500/50',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ label, error, options = [], children, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20 appearance-none cursor-pointer',
        error && 'border-red-500/50',
        className
      )}
      {...props}
    >
      {children ? children : options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[#1E293B] text-white">{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Select.displayName = 'Select';
