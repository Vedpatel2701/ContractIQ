import Link from "next/link";
import React, { type ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div className="border-b border-[var(--border)] pb-5">
      {backHref && (
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            <span>←</span> {backLabel}
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}