import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-lg bg-white/5', className)} {...props} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="rounded-xl bg-[#111827] border border-white/[0.06] p-6 space-y-4">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-3 w-full" />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);
