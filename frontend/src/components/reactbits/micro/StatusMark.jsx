'use client';

import React from 'react';

/**
 * React Bits StatusMark - Live Compiler / Provider Status Marker
 * Displays status indicator with pulse animation and technical badge.
 */
export function StatusMark({ status = 'online', label = '', className = '' }) {
  const configs = {
    online: {
      color: 'bg-success',
      text: 'text-success',
      ring: 'rgba(56, 217, 150, 0.4)'
    },
    busy: {
      color: 'bg-primary',
      text: 'text-primary',
      ring: 'rgba(99, 230, 255, 0.4)'
    },
    warning: {
      color: 'bg-warning',
      text: 'text-warning',
      ring: 'rgba(255, 184, 77, 0.4)'
    },
    offline: {
      color: 'bg-danger',
      text: 'text-danger',
      ring: 'rgba(255, 93, 103, 0.4)'
    }
  };

  const current = configs[status] || configs.online;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] ${className}`}>
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.color}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.color}`} />
      </span>
      {label && <span className="text-xs font-mono text-content-muted">{label}</span>}
    </div>
  );
}

export default StatusMark;
