import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type SharedButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type LinkButtonProps = SharedButtonProps & {
  href: string;
  type?: never;
  onClick?: never;
  disabled?: never;
};

type ActionButtonProps = SharedButtonProps & {
  href?: never;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  disabled?: boolean;
};

type ButtonProps = LinkButtonProps | ActionButtonProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-sm hover:brightness-95 dark:text-slate-950",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]",
};

export function Button(props: ButtonProps) {
  const { children, variant = "primary", className = "" } = props;

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${variantStyles[variant]} ${className}`}
      >
        {children}
        <span aria-hidden="true" className="text-base leading-none">
          →
        </span>
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${variantStyles[variant]} ${className}`}
    >
      {children}
      <span aria-hidden="true" className="text-base leading-none">
        →
      </span>
    </button>
  );
}