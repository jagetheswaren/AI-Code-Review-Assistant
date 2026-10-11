import React from 'react';
import { cn } from '../../lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 text-center animate-normal-in', className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-8 h-8 text-content-subtle" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-content mb-1.5">{title}</h3>
    {description && <p className="text-sm text-content-muted max-w-sm mb-6 leading-relaxed">{description}</p>}
    {action}
  </div>
);
