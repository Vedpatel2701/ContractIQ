import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-3xl border border-[var(--border)] bg-[var(--surface)] ${className}`} {...props}>
      {children}
    </div>
  );
}