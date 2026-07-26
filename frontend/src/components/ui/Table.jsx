import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, children, ...props }) => (
  <div className={cn('w-full overflow-x-auto', className)}>
    <table className="w-full" {...props}>{children}</table>
  </div>
);

export const TableHeader = ({ className, children, ...props }) => (
  <thead className={cn('border-b border-white/[0.06]', className)} {...props}>{children}</thead>
);

export const TableBody = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-white/[0.04]', className)} {...props}>{children}</tbody>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={cn('transition-colors hover:bg-white/[0.02]', className)} {...props}>{children}</tr>
);

export const TableHead = ({ className, children, ...props }) => (
  <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider', className)} {...props}>{children}</th>
);

export const TableCell = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3 text-sm text-slate-300', className)} {...props}>{children}</td>
);
