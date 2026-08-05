import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-400 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.22)] hover:bg-cyan-300",
  secondary:
    "border border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/30 hover:bg-white/10",
};

export function Button({ children, href, variant = "primary" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${variantStyles[variant]}`}
    >
      {children}
      <span aria-hidden="true" className="text-base leading-none">
        →
      </span>
    </Link>
  );
}