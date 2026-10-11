import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-sm bg-surface-elevated', className)} {...props} />
);

export const SkeletonCard = ({ lines = 3, className }) => (
  <div className={cn("rounded-md bg-surface border border-surface-border p-5 space-y-4 shadow-sm", className)}>
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
    <div className="pt-2 space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, className }) => (
  <div className={cn("space-y-3", className)}>
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);
