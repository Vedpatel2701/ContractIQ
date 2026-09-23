import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] shadow-[var(--shadow-sm)] transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-500 ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
