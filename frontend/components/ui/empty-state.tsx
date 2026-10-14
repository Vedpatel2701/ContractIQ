import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  variant?: "default" | "card" | "compact" | "success";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "card",
  className = "",
}: EmptyStateProps) {
  const isCard = variant === "card";
  const isCompact = variant === "compact";
  const isSuccess = variant === "success";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        isCard
          ? "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 shadow-[var(--shadow-card)]"
          : isCompact
          ? "py-6 px-4"
          : "py-10 px-4"
      } ${className}`}
    >
      {/* Icon Container */}
      <div
        className={`flex items-center justify-center rounded-2xl ${
          isCompact ? "h-10 w-10 mb-2.5" : "h-12 w-12 sm:h-14 sm:w-14 mb-3.5"
        } ${
          isSuccess
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60"
        }`}
      >
        {icon ? (
          icon
        ) : (
          <svg
            className={isCompact ? "h-5 w-5" : "h-6 w-6 sm:h-7 sm:w-7"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      {/* Title & Description */}
      <h3
        className={`font-bold text-[var(--foreground)] ${
          isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-1 text-xs text-[var(--text-secondary)] leading-relaxed ${
          isCompact ? "max-w-xs" : "max-w-md"
        }`}
      >
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
