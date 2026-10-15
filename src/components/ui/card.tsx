import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
