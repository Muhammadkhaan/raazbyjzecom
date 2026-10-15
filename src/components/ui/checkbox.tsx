import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: string;
}

export function Checkbox({ label, helperText, className = '', ...props }: CheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
        <input
          type="checkbox"
          className={`rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/50 h-4 w-4 ${className}`}
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
      {helperText && <p className="text-xs text-slate-500 pl-6">{helperText}</p>}
    </div>
  );
}
