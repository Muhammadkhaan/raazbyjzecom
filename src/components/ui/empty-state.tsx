import React from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-4">
      {icon && <div className="p-4 rounded-full bg-slate-800/80 text-amber-400">{icon}</div>}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-serif font-medium text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
      {!action && actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} variant="primary" size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
