import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
}
