"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/status-badge";
import { fetchNotifications } from "@/lib/api";

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

const defaultFallbackNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    contract_id: "CON-1098",
    title: "Legal Review Required: Vendor Services Master Agreement",
    description: "Agreement with Apex Operations has elevated risk factors ('High'). Broad indemnity language and service credit terms require legal review.",
    alert_type: "risk",
    is_read: false,
    is_demo: false,
  },
  {
    id: "notif-2",
    contract_id: "CON-1042",
    title: "Renewal Deadline Approaching: Enterprise SaaS Agreement",
    description: "Renewal scheduled for 2026-08-28. Notice window requirement: 30 days before renewal.",
    alert_type: "renewal",
    is_read: false,
    is_demo: false,
  },
  {
    id: "notif-3",
    contract_id: "CON-1120",
    title: "Payment & SLA Notice: Manufacturing Supply Agreement",
    description: "Quarterly purchase commitments with Vertex Manufacturing. Delivery delays trigger liquidated damages up to 8% of affected order value.",
    alert_type: "payment",
    is_read: false,
    is_demo: false,
  },
  {
    id: "notif-4",
    contract_id: "DEMO-105",
    title: "Renewal Window Approaching: Office Lease Agreement",
    description: "Corporate HQ Lease extension option notice deadline is approaching. Confirm terms 60 days in advance.",
    alert_type: "renewal",
    is_read: true,
    is_demo: true,
  },
  {
    id: "notif-5",
    contract_id: "DEMO-104",
    title: "Contract Expired: Software License Agreement",
    description: "Legacy software licensing agreement expired. Final IP transition sign-off remains outstanding.",
    alert_type: "expiry",
    is_read: true,
    is_demo: true,
  },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(defaultFallbackNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        if (data && data.length > 0) {
          const formatted = data.map((d: NotificationItem) => ({
            ...d,
            is_demo: d.contract_id?.startsWith("DEMO-") ?? false,
          }));
          setItems(formatted);
        }
      })
      .catch(() => {
        // Fallback initialized in state
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
              disabled={unreadCount === 0}
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

      {/* Feed List */}
      {visibleItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              {filter === "unread" ? "All alerts caught up" : "No notifications"}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Approaching renewal notice windows, payment alerts, and risk indicators will be logged here.
            </p>
          </div>
        </Card>
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
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] font-medium px-1"
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
