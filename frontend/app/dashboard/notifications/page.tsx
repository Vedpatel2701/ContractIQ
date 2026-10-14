"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DemoBadge } from "@/components/ui/status-badge";
import { fetchNotifications, getCurrentUser, type UserRecord } from "@/lib/api";

type NotificationItem = {
  id: string | number;
  contract_id?: string;
  title: string;
  description: string;
  alert_type?: string;
  is_read?: boolean;
  read?: boolean;
  is_demo?: boolean;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const loadNotificationsData = () => {
    setIsLoading(true);
    setErrorMessage(null);
    fetchNotifications()
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((d: NotificationItem) => ({
            ...d,
            is_demo: d.contract_id?.startsWith("DEMO-") ?? false,
          }));
          setItems(formatted);
        } else {
          setItems([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMessage(err?.message || "Failed to load notifications from server.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadNotificationsData();
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
        description="Actionable events, renewal deadlines, payment notices, and risk reviews across workspace contracts."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isLoading}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          All Alerts ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filter === "unread"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Feed List or Empty States */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : errorMessage ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Unable to load notifications"
          description={errorMessage}
          action={
            <Button variant="outline" size="sm" onClick={loadNotificationsData}>
              Retry Connection
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          variant="card"
          title="No notifications or alerts"
          description="All caught up! ContractIQ monitors your contracts in the background and will automatically alert you about upcoming renewal windows, notice deadlines, and elevated legal risks."
          action={
            currentUser?.role !== "VIEWER" ? (
              <Button href="/dashboard/contracts/upload" size="sm">
                + Analyze Contract
              </Button>
            ) : (
              <Button href="/dashboard/contracts" variant="outline" size="sm">
                Browse Contracts
              </Button>
            )
          }
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          variant="card"
          title="All alerts caught up"
          description="You have reviewed all outstanding notifications. Switch to view all alerts to browse past notifications and historical records."
          action={
            <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
              View All Alerts ({items.length})
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isRead = item.is_read ?? item.read;
            const isPayment = item.alert_type === "payment";
            const isRisk = item.alert_type === "risk";
            const isExpiry = item.alert_type === "expiry";

            return (
              <Card
                key={item.id}
                className={`p-4 transition-colors shadow-sm ${
                  !isRead ? "border-l-4 border-l-blue-600 dark:border-l-blue-500" : "opacity-85"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isPayment
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : isRisk
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : isExpiry
                            ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {isPayment
                          ? "Payment Notice"
                          : isRisk
                          ? "Risk Alert"
                          : isExpiry
                          ? "Expiry Alert"
                          : "Renewal Alert"}
                      </span>
                      <DemoBadge isDemo={item.is_demo} />
                      <h3 className="text-xs font-bold text-[var(--foreground)]">{item.title}</h3>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" title="Unread Alert" />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
                    {item.contract_id && (
                      <Link
                        href={`/dashboard/contracts/${item.contract_id}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                      >
                        Review Contract →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] font-medium px-1 cursor-pointer"
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
