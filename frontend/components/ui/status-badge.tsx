import React from "react";

type StatusType = "Active" | "Review Required" | "Expiring" | "Draft" | "Expired" | string;
type RiskType = "Low" | "Moderate" | "High" | "Critical" | string;

const statusStyles: Record<string, { bg: string; dot: string }> = {
  Active: {
    bg: "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]",
    dot: "bg-[var(--success)]",
  },
  Expiring: {
    bg: "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]",
    dot: "bg-[var(--warning)]",
  },
  "Review Required": {
    bg: "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]",
    dot: "bg-[var(--warning)]",
  },
  Draft: {
    bg: "bg-[var(--surface-strong)] text-[var(--text-secondary)] border-[var(--border-strong)]",
    dot: "bg-[var(--text-muted)]",
  },
  Expired: {
    bg: "bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]",
    dot: "bg-[var(--danger)]",
  },
};

export function StatusBadge({ status }: { status?: StatusType }) {
  const value = status || "Active";
  const style = statusStyles[value] || {
    bg: "bg-[var(--surface-strong)] text-[var(--text-secondary)] border-[var(--border)]",
    dot: "bg-[var(--text-muted)]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${style.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{value}</span>
    </span>
  );
}

export function RiskBadge({ risk }: { risk?: RiskType }) {
  const value = risk && risk !== "Not Assessed" ? risk : "Moderate";
  const tone =
    value === "Low"
      ? "text-[var(--success-text)] bg-[var(--success-bg)] border-[var(--success-border)]"
      : value === "Moderate"
      ? "text-[var(--warning-text)] bg-[var(--warning-bg)] border-[var(--warning-border)]"
      : "text-[var(--danger-text)] bg-[var(--danger-bg)] border-[var(--danger-border)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {value} Risk
    </span>
  );
}

export function DemoBadge({ isDemo }: { isDemo?: boolean }) {
  if (!isDemo) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
      Sample
    </span>
  );
}

