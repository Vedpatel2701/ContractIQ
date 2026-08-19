"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

const initialNotifications = [
  { id: 1, title: "Renewal approaching", description: "Northstar Labs needs confirmation before 28 Aug.", tone: "info", read: false },
  { id: 2, title: "High-risk contract detected", description: "Apex Operations has three clauses waiting for legal approval.", tone: "warning", read: false },
  { id: 3, title: "Payment deadline", description: "The next Vertex Manufacturing milestone payment is due on 21 Aug.", tone: "info", read: true },
  { id: 4, title: "Contract expiry approaching", description: "BlueRiver Capital confidentiality agreement expires on 01 Oct.", tone: "success", read: true },
];

export default function NotificationsPage() {
  const [items, setItems] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visibleItems = filter === "unread" ? items.filter((item) => !item.read) : items;

  const markAllRead = () => setItems((current) => current.map((item) => ({ ...item, read: true })));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Your latest contract updates"
        description="Keep track of renewals, review items and recent document changes across your workspace."
        actions={<div className="flex flex-wrap items-center gap-3"><span className="text-sm text-slate-600 dark:text-slate-300">{items.filter((item) => !item.read).length} unread</span><Button onClick={markAllRead} variant="secondary">Mark all read</Button></div>}
      />

      <div className="flex gap-2" role="group" aria-label="Notification filter">
        <button type="button" onClick={() => setFilter("all")} className={`rounded-full px-3 py-2 text-sm font-medium ${filter === "all" ? "bg-[var(--accent)] text-white dark:text-slate-950" : "border border-[var(--border)] text-slate-600 dark:text-slate-300"}`}>All</button>
        <button type="button" onClick={() => setFilter("unread")} className={`rounded-full px-3 py-2 text-sm font-medium ${filter === "unread" ? "bg-[var(--accent)] text-white dark:text-slate-950" : "border border-[var(--border)] text-slate-600 dark:text-slate-300"}`}>Unread</button>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="font-semibold text-[var(--foreground)]">{filter === "unread" ? "You&apos;re all caught up" : "No notifications"}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">New contract activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
          <div key={item.id} className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ${item.read ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><p className="font-medium text-[var(--foreground)]">{item.title}</p>{!item.read ? <span className="h-2 w-2 rounded-full bg-cyan-500" aria-label="Unread" /> : null}</div>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.tone}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
            <div className="mt-4 flex justify-end gap-3 text-sm">
              {!item.read ? <button type="button" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))} className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">Mark as read</button> : null}
              <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400">Clear</button>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
