import React from "react";

type StatusType = "Active" | "Review Required" | "Draft" | "Expired" | string;
type RiskType = "Low" | "Moderate" | "High" | "Critical" | string;

export function StatusBadge({ status }: { status: StatusType }) {
  let style = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  switch (status) {
    case "Active":
      style = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
      break;
    case "Review Required":
      style = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
      break;
    case "Draft":
      style = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60";
      break;
    case "Expired":
      style = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskType }) {
  let style = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  switch (risk) {
    case "Low":
      style = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
      break;
    case "Moderate":
      style = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
      break;
    case "High":
      style = "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60";
      break;
    case "Critical":
      style = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}>
      <span className="font-semibold uppercase tracking-wider text-[10px]">Risk:</span>
      {risk}
    </span>
  );
}
