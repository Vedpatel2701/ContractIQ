import Link from "next/link";
import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-lg shadow-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm font-semibold gap-2",
    lg: "px-5 py-2.5 text-base font-bold gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus-visible:outline-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    outline:
      "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] active:bg-[var(--surface-strong)] shadow-sm",
    ghost:
      "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-strong)] shadow-none border border-transparent",

    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:outline-red-600 dark:bg-red-600 dark:hover:bg-red-500",
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </button>
  );
}


