"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchNotifications } from "@/lib/api";

type NotificationItem = {
  id: string | number;
  contract_id?: string;
  title: string;
  description: string;
  alert_type?: string;
  is_read?: boolean;
  read?: boolean;
};

const defaultFallbackNotifications: NotificationItem[] = [
  {
    id: "1",
    contract_id: "CON-1042",
    title: "Renewal Notice Window Approaching",
    description: "Northstar Labs Enterprise SaaS Agreement requires renewal confirmation before August 28.",
    alert_type: "renewal",
    is_read: false,
  },
  {
    id: "2",
    contract_id: "CON-1098",
    title: "Elevated Risk Identified in Review",
    description: "Apex Operations Vendor Agreement has 3 indemnity & liability terms requiring legal sign-off.",
    alert_type: "risk",
    is_read: false,
  },
  {
    id: "3",
    contract_id: "CON-1120",
    title: "Scheduled Milestone Review",
    description: "Vertex Manufacturing Procurement Agreement quarterly review period begins.",
    alert_type: "renewal",
    is_read: true,
  },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(defaultFallbackNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        if (data && data.length > 0) {
          setItems(data);
        }
      });
  }, []);

  const unreadCount = items.filter((item) => !(item.is_read ?? item.read)).length;
  const visibleItems = filter === "unread" ? items.filter((item) => !(item.is_read ?? item.read)) : items;

  const handleMarkAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, is_read: true, read: true })));
  };

  const handleDismiss = (id: string | number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Track contract renewal windows, high-risk review flags, and upcoming deadline action items."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "all"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          All Notifications ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "unread"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification Feed */}
      {visibleItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="mt-3 text-base font-bold text-[var(--foreground)]">
            {filter === "unread" ? "You're all caught up!" : "No notifications"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Approaching contract renewals and risk alerts will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isRead = item.is_read ?? item.read;
            const isRisk = item.alert_type === "risk";

            return (
              <Card
                key={item.id}
                className={`p-4 transition-colors ${
                  !isRead ? "border-l-4 border-l-blue-600 dark:border-l-blue-500" : "opacity-85"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isRisk
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {isRisk ? "Risk Alert" : "Renewal Deadline"}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{item.title}</h3>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
                    {item.contract_id && (
                      <Link
                        href={`/dashboard/contracts/${item.contract_id}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        Review Contract →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
