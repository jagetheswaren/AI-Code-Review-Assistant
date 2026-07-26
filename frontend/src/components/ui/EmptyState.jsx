import React from 'react';
import { cn } from '../../lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/[0.06] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);
