import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)] shadow-[var(--shadow-card)] transition-all duration-150 ${
        hover
          ? "hover:border-slate-300 hover:shadow-[var(--shadow-elevated)] dark:hover:border-slate-600 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}