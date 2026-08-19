import type { ReactNode } from "react";

const styles = {
  Active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 dark:border-emerald-600/20 dark:bg-emerald-100 dark:text-emerald-700",
  "Review Required": "border-amber-500/20 bg-amber-500/10 text-amber-300 dark:border-amber-600/20 dark:bg-amber-100 dark:text-amber-700",
  Draft: "border-sky-500/20 bg-sky-500/10 text-sky-300 dark:border-sky-600/20 dark:bg-sky-100 dark:text-sky-700",
  Expired: "border-rose-500/20 bg-rose-500/10 text-rose-300 dark:border-rose-600/20 dark:bg-rose-100 dark:text-rose-700"
} as const;

export function StatusBadge({ children }: { children: ReactNode }) {
  const tone = styles[children as keyof typeof styles] ?? styles.Draft;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}
