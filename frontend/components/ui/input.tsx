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
        className={`w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] shadow-[var(--shadow-sm)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
          error ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
