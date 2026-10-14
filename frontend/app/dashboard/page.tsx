"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/status-badge";
import {
  fetchDashboardData,
  type DashboardResponse,
  type DeadlineItem,
  type RecentActivityItem,
} from "@/lib/api";

type DeadlineFilterTab =
  | "ALL"
  | "EXPIRY"
  | "RENEWAL"
  | "NOTICE"
  | "UPCOMING"
  | "OVERDUE"
  | "MISSING";

type DateRangeFilter = "ALL" | "30_DAYS" | "90_DAYS" | "THIS_YEAR";

type ActiveInsightTab = "RISKS" | "DEADLINES" | "CLAUSES" | "ACTIONS";

export default function EnterpriseDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deadline Tracker Interactive States
  const [activeTab, setActiveTab] = useState<DeadlineFilterTab>("ALL");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<DeadlineItem | null>(null);

  // AI Insights Tab State
  const [insightTab, setInsightTab] = useState<ActiveInsightTab>("RISKS");

  // Calendar State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(() => {
    // ContractIQ standard active date: October 2026
    return new Date(2026, 9, 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardData();
      setData(res);
    } catch (err: any) {
      console.error("[Dashboard] Error loading intelligence:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort deadline records based on active tabs
  const filteredDeadlines = useMemo(() => {
    if (!data?.deadlines) return [];
    let list = [...data.deadlines];

    // Primary Category / Type Tabs
    if (activeTab === "EXPIRY") {
      list = list.filter((d) => d.type === "EXPIRY" && Boolean(d.date));
      // Chronological earliest first
      list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    } else if (activeTab === "RENEWAL") {
      list = list.filter((d) => d.type === "RENEWAL" && Boolean(d.date));
      // Chronological earliest first
      list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    } else if (activeTab === "NOTICE") {
      list = list.filter((d) => d.type === "NOTICE" && Boolean(d.date));
      list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    } else if (activeTab === "UPCOMING") {
      list = list.filter((d) => d.daysRemaining !== null && d.daysRemaining >= 0);
      list.sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999));
    } else if (activeTab === "OVERDUE") {
      list = list.filter((d) => d.daysRemaining !== null && d.daysRemaining < 0);
      // Most overdue first (e.g. -60 before -10)
      list.sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
    } else if (activeTab === "MISSING") {
      list = list.filter((d) => d.type === "MISSING_DATE" || !d.date);
    } else {
      // ALL: prioritized by urgency (overdue, then soonest upcoming, then missing)
      list.sort((a, b) => {
        if (a.daysRemaining === null && b.daysRemaining === null) return 0;
        if (a.daysRemaining === null) return 1;
        if (b.daysRemaining === null) return -1;
        return a.daysRemaining - b.daysRemaining;
      });
    }

    // Secondary Date Range Filter
    if (dateRange === "30_DAYS") {
      list = list.filter((d) => d.daysRemaining !== null && d.daysRemaining >= -30 && d.daysRemaining <= 30);
    } else if (dateRange === "90_DAYS") {
      list = list.filter((d) => d.daysRemaining !== null && d.daysRemaining >= -90 && d.daysRemaining <= 90);
    } else if (dateRange === "THIS_YEAR") {
      list = list.filter((d) => d.date && d.date.startsWith("2026"));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.contractName.toLowerCase().includes(q) ||
          d.company.toLowerCase().includes(q) ||
          d.contractType.toLowerCase().includes(q) ||
          (d.action && d.action.toLowerCase().includes(q))
      );
    }

    // Calendar day click filter
    if (selectedCalendarDate) {
      list = list.filter((d) => d.date === selectedCalendarDate);
    }

    return list;
  }, [data?.deadlines, activeTab, dateRange, searchQuery, selectedCalendarDate]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      items: DeadlineItem[];
    }> = [];

    // Prefix days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const str = prevDate.toISOString().split("T")[0];
      days.push({
        dateStr: str,
        dayNumber: dayNum,
        isCurrentMonth: false,
        items: (data?.deadlines || []).filter((d) => d.date === str),
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const str = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        dateStr: str,
        dayNumber: day,
        isCurrentMonth: true,
        items: (data?.deadlines || []).filter((d) => d.date === str),
      });
    }

    // Suffix days to complete grid (42 cells = 6 weeks)
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const str = nextDate.toISOString().split("T")[0];
      days.push({
        dateStr: str,
        dayNumber: day,
        isCurrentMonth: false,
        items: (data?.deadlines || []).filter((d) => d.date === str),
      });
    }

    return days;
  }, [currentCalendarMonth, data?.deadlines]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2" />
          <div className="h-80 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
        <div className="h-96 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)]">Failed to load dashboard intelligence</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">{error || "Could not retrieve contract portfolio metrics."}</p>
        <button
          onClick={loadData}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { executiveOverview, smartInsights, recentActivity } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="Enterprise Portfolio Intelligence"
        title="ContractIQ Command Center"
        description="Real-time portfolio analytics, automated legal risk monitoring, and proactive deadline management."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button href="/dashboard/assistant" variant="outline" size="md">
              💬 AI Assistant
            </Button>
            <Button href="/dashboard/contracts/upload" size="md">
              + Analyze Contract
            </Button>
          </div>
        }
      />

      {/* 2. Executive Overview: 5 Primary Metric Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Executive Key Performance Indicators
          </h2>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Current as of Oct 2026
          </span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Contracts */}
          <Card className="p-4 border-l-4 border-l-slate-700 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Contracts
              </span>
              <span className="rounded-md bg-slate-100 p-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] font-mono">
              {executiveOverview.totalContracts}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Authorized in portfolio
            </p>
          </Card>

          {/* Active Contracts */}
          <Card className="p-4 border-l-4 border-l-emerald-600 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Contracts
              </span>
              <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
              {executiveOverview.activeContracts}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Currently enforceable
            </p>
          </Card>

          {/* Contracts Expiring Soon */}
          <Card className="p-4 border-l-4 border-l-amber-500 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Expiring ≤ 90 Days
              </span>
              <span className="rounded-md bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {executiveOverview.contractsExpiringSoon}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Term expiration pending
            </p>
          </Card>

          {/* Upcoming Renewals */}
          <Card className="p-4 border-l-4 border-l-blue-600 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Upcoming Renewals
              </span>
              <span className="rounded-md bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {executiveOverview.upcomingRenewals}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              With auto/annual renewal
            </p>
          </Card>

          {/* Overdue Deadlines or Actions */}
          <Card className="p-4 border-l-4 border-l-rose-600 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Overdue Actions
              </span>
              <span className="rounded-md bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {executiveOverview.overdueCount}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Notice window exceeded
            </p>
          </Card>
        </div>
      </section>

      {/* 3. Executive Visual Analytics (Charts & Portfolio Distributions) */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Risk Distribution Chart */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Risk Profile Distribution</h3>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {executiveOverview.highRiskContracts} High / Critical
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Portfolio vulnerability grading based on clause severity
            </p>

            {/* Visual SVG Segmented Ring & Legend */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Low Risk Segment (Green) */}
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${((executiveOverview.riskDistribution["Low"] || 0) / (executiveOverview.totalContracts || 1)) * 100}, 100`}
                    strokeDashoffset="0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Moderate Risk Segment (Amber) */}
                  <path
                    className="text-amber-500"
                    strokeDasharray={`${((executiveOverview.riskDistribution["Moderate"] || 0) / (executiveOverview.totalContracts || 1)) * 100}, 100`}
                    strokeDashoffset={`-${((executiveOverview.riskDistribution["Low"] || 0) / (executiveOverview.totalContracts || 1)) * 100}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* High/Critical Risk Segment (Rose) */}
                  <path
                    className="text-rose-500"
                    strokeDasharray={`${(((executiveOverview.riskDistribution["High"] || 0) + (executiveOverview.riskDistribution["Critical"] || 0)) / (executiveOverview.totalContracts || 1)) * 100}, 100`}
                    strokeDashoffset={`-${(((executiveOverview.riskDistribution["Low"] || 0) + (executiveOverview.riskDistribution["Moderate"] || 0)) / (executiveOverview.totalContracts || 1)) * 100}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-extrabold text-[var(--foreground)] font-mono">
                    {executiveOverview.totalContracts}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Low Risk
                  </span>
                  <span className="font-bold font-mono text-[var(--foreground)]">
                    {executiveOverview.riskDistribution["Low"] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Moderate Risk
                  </span>
                  <span className="font-bold font-mono text-[var(--foreground)]">
                    {executiveOverview.riskDistribution["Moderate"] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    High & Critical
                  </span>
                  <span className="font-bold font-mono text-[var(--foreground)]">
                    {(executiveOverview.riskDistribution["High"] || 0) + (executiveOverview.riskDistribution["Critical"] || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex justify-between items-center">
            <span>Portfolio Exposure Index:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {Math.round((((executiveOverview.riskDistribution["High"] || 0) + (executiveOverview.riskDistribution["Critical"] || 0)) / (executiveOverview.totalContracts || 1)) * 100)}% Elevated
            </span>
          </div>
        </Card>

        {/* Contract Status Breakdown */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Contract Status Breakdown</h3>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {executiveOverview.activeContracts} Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Operational lifecycle state of managed agreements
            </p>

            <div className="mt-4 space-y-2.5">
              {/* Active */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Active ({executiveOverview.activeContracts})</span>
                  <span className="text-[var(--text-muted)] font-mono">
                    {Math.round(((executiveOverview.activeContracts || 0) / (executiveOverview.totalContracts || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${((executiveOverview.activeContracts || 0) / (executiveOverview.totalContracts || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Review Required */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Review Required ({executiveOverview.reviewRequired})</span>
                  <span className="text-[var(--text-muted)] font-mono">
                    {Math.round(((executiveOverview.reviewRequired || 0) / (executiveOverview.totalContracts || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${((executiveOverview.reviewRequired || 0) / (executiveOverview.totalContracts || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Draft */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Draft / Pending ({executiveOverview.draftContracts})</span>
                  <span className="text-[var(--text-muted)] font-mono">
                    {Math.round(((executiveOverview.draftContracts || 0) / (executiveOverview.totalContracts || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${((executiveOverview.draftContracts || 0) / (executiveOverview.totalContracts || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex justify-between items-center">
            <span>Governance Audit Status:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Verified in PostgreSQL
            </span>
          </div>
        </Card>

        {/* Contract Categories Breakdown */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Agreement Categories</h3>
              <span className="text-xs font-semibold text-slate-500">
                {Object.keys(executiveOverview.categoryDistribution).length} Types
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Distribution across commercial contract types
            </p>

            <div className="mt-3.5 space-y-2">
              {Object.entries(executiveOverview.categoryDistribution).slice(0, 5).map(([cat, count]) => {
                const pct = Math.round((count / (executiveOverview.totalContracts || 1)) * 100);
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)] truncate max-w-[170px]" title={cat}>
                      {cat}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[var(--foreground)] text-[11px] w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex justify-between items-center">
            <span>Enterprise Classification:</span>
            <Link
              href="/dashboard/contracts"
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Browse all →
            </Link>
          </div>
        </Card>
      </section>

      {/* 4. Smart AI Insights Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Smart AI Insights & Analysis
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Grounded findings extracted directly from contract clauses and stored risk indicators
            </p>
          </div>

          {/* 4 Sub-Tabs for AI Insights */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-1 text-xs">
            <button
              onClick={() => setInsightTab("RISKS")}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                insightTab === "RISKS"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              High-Risk Alerts ({smartInsights.highRiskAlerts.length})
            </button>
            <button
              onClick={() => setInsightTab("DEADLINES")}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                insightTab === "DEADLINES"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Imminent Deadlines ({smartInsights.upcomingDeadlines.length})
            </button>
            <button
              onClick={() => setInsightTab("CLAUSES")}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                insightTab === "CLAUSES"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Clause Concerns ({smartInsights.missingOrProblematicClauses.length})
            </button>
            <button
              onClick={() => setInsightTab("ACTIONS")}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                insightTab === "ACTIONS"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Action Items ({smartInsights.actionableRecommendations.length})
            </button>
          </div>
        </div>

        {/* Tab 1: High-Risk Alerts */}
        {insightTab === "RISKS" && (
          <div className="grid gap-3 md:grid-cols-2">
            {smartInsights.highRiskAlerts.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] col-span-2 py-4">No high-risk contracts flagged.</p>
            ) : (
              smartInsights.highRiskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-rose-200/80 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20 p-4 space-y-2 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/dashboard/contracts/${alert.contractId}`}
                        className="text-xs font-bold text-[var(--foreground)] hover:text-blue-600 transition"
                      >
                        {alert.contractName}
                      </Link>
                      <p className="text-[11px] text-[var(--text-muted)]">{alert.company}</p>
                    </div>
                    <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                      {alert.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
                    {alert.alert}
                  </p>
                  <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] italic">Action: {alert.recommendation}</span>
                    <Link
                      href={`/dashboard/contracts/${alert.contractId}`}
                      className="font-bold text-blue-600 hover:underline dark:text-blue-400 shrink-0 ml-2"
                    >
                      Inspect →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Imminent Deadlines */}
        {insightTab === "DEADLINES" && (
          <div className="grid gap-3 md:grid-cols-2">
            {smartInsights.upcomingDeadlines.map((dl, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)] truncate max-w-[220px]">
                    {dl.contractName}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      dl.daysRemaining !== null && dl.daysRemaining < 0
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                        : dl.daysRemaining !== null && dl.daysRemaining <= 30
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                    }`}
                  >
                    {dl.daysRemaining !== null && dl.daysRemaining < 0
                      ? `${Math.abs(dl.daysRemaining)}d OVERDUE`
                      : `${dl.daysRemaining}d REMAINING`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{dl.typeLabel}:</span>
                  <span className="font-mono font-medium">{dl.date || "Unspecified"}</span>
                  <span>•</span>
                  <span>{dl.company}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-muted)] p-2 rounded-md">
                  {dl.action}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Missing & Problematic Clauses */}
        {insightTab === "CLAUSES" && (
          <div className="grid gap-3 md:grid-cols-2">
            {smartInsights.missingOrProblematicClauses.map((clause, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">{clause.contractName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{clause.company}</p>
                  </div>
                  <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                    {clause.category}
                  </span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  {clause.issue}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="font-semibold text-[var(--foreground)]">Remedy:</span> {clause.recommendedRemedy}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Action Items */}
        {insightTab === "ACTIONS" && (
          <div className="space-y-2">
            {smartInsights.actionableRecommendations.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] transition"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        act.priority === "High" ? "bg-rose-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-[var(--foreground)]">{act.contractName}</span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">({act.company})</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{act.recommendation}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {act.timing}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. INTERACTIVE DEADLINE TRACKER (HIGHEST PRIORITY) */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[var(--foreground)]">
                Interactive Contract Deadline Tracker
              </h2>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold px-2 py-0.5">
                {filteredDeadlines.length} Records
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Chronologically sorted event horizons: contract expirations, renewal windows, and notice cutoffs.
            </p>
          </div>

          {/* Controls: Search, Date-Range, and View-Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date-Range Dropdown */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Horizons</option>
              <option value="30_DAYS">Next 30 Days</option>
              <option value="90_DAYS">Next 90 Days</option>
              <option value="THIS_YEAR">Year 2026</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setSelectedCalendarDate(null);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition ${
                  viewMode === "list"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>☰</span> List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition ${
                  viewMode === "calendar"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>📅</span> Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Primary Filter Tabs for Deadline Types */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <button
            onClick={() => {
              setActiveTab("ALL");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            All Deadlines ({data.deadlines.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("EXPIRY");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "EXPIRY"
                ? "bg-blue-700 text-white dark:bg-blue-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Expiry Dates ({data.deadlines.filter((d) => d.type === "EXPIRY").length})
          </button>
          <button
            onClick={() => {
              setActiveTab("RENEWAL");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "RENEWAL"
                ? "bg-blue-700 text-white dark:bg-blue-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Renewal Dates ({data.deadlines.filter((d) => d.type === "RENEWAL").length})
          </button>
          <button
            onClick={() => {
              setActiveTab("NOTICE");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "NOTICE"
                ? "bg-blue-700 text-white dark:bg-blue-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Notice Deadlines ({data.deadlines.filter((d) => d.type === "NOTICE").length})
          </button>
          <button
            onClick={() => {
              setActiveTab("UPCOMING");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "UPCOMING"
                ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Upcoming (≥ 0d)
          </button>
          <button
            onClick={() => {
              setActiveTab("OVERDUE");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "OVERDUE"
                ? "bg-rose-700 text-white dark:bg-rose-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Overdue (&lt; 0d)
          </button>
          <button
            onClick={() => {
              setActiveTab("MISSING");
              setSelectedCalendarDate(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "MISSING"
                ? "bg-slate-700 text-white dark:bg-slate-600 shadow-sm"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Missing / Unclear Dates ({data.deadlines.filter((d) => d.type === "MISSING_DATE").length})
          </button>
        </div>

        {selectedCalendarDate && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950/60 dark:text-blue-200">
            <span>
              Filtering by calendar date: <strong className="font-mono">{selectedCalendarDate}</strong>
            </span>
            <button
              onClick={() => setSelectedCalendarDate(null)}
              className="font-bold underline hover:text-blue-700"
            >
              Clear date filter
            </button>
          </div>
        )}

        {/* View Mode: List / Table View */}
        {viewMode === "list" ? (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="py-3 px-4">Contract / Entity</th>
                    <th className="py-3 px-3">Deadline Type</th>
                    <th className="py-3 px-3">Relevant Date</th>
                    <th className="py-3 px-3">Status / Days</th>
                    <th className="py-3 px-4">Required Action</th>
                    <th className="py-3 px-3 text-right">Side Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredDeadlines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No deadline records match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDeadlines.map((item) => {
                      const isOverdue = item.daysRemaining !== null && item.daysRemaining < 0;
                      const isToday = item.daysRemaining === 0;
                      const isUrgent = item.daysRemaining !== null && item.daysRemaining > 0 && item.daysRemaining <= 30;
                      const isMissing = item.daysRemaining === null;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedContract(item)}
                          className="group cursor-pointer transition hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                        >
                          {/* Contract name & company */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[var(--foreground)] group-hover:text-blue-600 transition block truncate max-w-[260px]">
                              {item.contractName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] truncate block max-w-[240px]">
                              {item.company} • {item.contractType}
                            </span>
                          </td>

                          {/* Deadline Type Badge */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                item.type === "EXPIRY"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : item.type === "RENEWAL"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                  : item.type === "NOTICE"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {item.typeLabel}
                            </span>
                          </td>

                          {/* Relevant Date */}
                          <td className="py-3.5 px-3">
                            {item.date ? (
                              <span className="font-mono font-semibold text-[var(--foreground)]">
                                {item.date}
                              </span>
                            ) : (
                              <span className="italic text-[var(--text-muted)]">Unspecified</span>
                            )}
                          </td>

                          {/* Days remaining / overdue badge */}
                          <td className="py-3.5 px-3">
                            {isMissing ? (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Term Unspecified
                              </span>
                            ) : isOverdue ? (
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                {Math.abs(item.daysRemaining!)}d Overdue
                              </span>
                            ) : isToday ? (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Due Today
                              </span>
                            ) : isUrgent ? (
                              <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                {item.daysRemaining}d remaining
                              </span>
                            ) : (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {item.daysRemaining}d remaining
                              </span>
                            )}
                          </td>

                          {/* Required Action */}
                          <td className="py-3.5 px-4 text-[var(--text-secondary)] text-xs max-w-xs truncate" title={item.action}>
                            {item.action}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContract(item);
                              }}
                              className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode: Calendar View */
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentCalendarMonth(
                      new Date(
                        currentCalendarMonth.getFullYear(),
                        currentCalendarMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-bold hover:bg-[var(--surface-muted)]"
                >
                  ← Prev
                </button>
                <h3 className="text-sm font-extrabold text-[var(--foreground)] font-mono">
                  {currentCalendarMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() =>
                    setCurrentCalendarMonth(
                      new Date(
                        currentCalendarMonth.getFullYear(),
                        currentCalendarMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-bold hover:bg-[var(--surface-muted)]"
                >
                  Next →
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Expiry
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Renewal
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Notice
                </span>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 border-t border-[var(--border)] pt-3 text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1 text-[11px] font-bold text-[var(--text-muted)] uppercase">
                  {day}
                </div>
              ))}

              {calendarDays.map((cell, idx) => {
                const isSelected = selectedCalendarDate === cell.dateStr;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.items.length > 0) {
                        setSelectedCalendarDate(cell.dateStr);
                      }
                    }}
                    className={`min-h-[72px] rounded-lg border p-1 text-left transition ${
                      cell.isCurrentMonth
                        ? "border-[var(--border)] bg-[var(--surface)]"
                        : "border-transparent bg-[var(--surface-muted)] opacity-50"
                    } ${
                      isSelected
                        ? "ring-2 ring-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                        : cell.items.length > 0
                        ? "cursor-pointer hover:border-blue-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={cell.isCurrentMonth ? "font-bold text-[var(--foreground)]" : "text-slate-400"}>
                        {cell.dayNumber}
                      </span>
                      {cell.items.length > 0 && (
                        <span className="rounded-full bg-blue-600 px-1.5 text-[9px] font-extrabold text-white">
                          {cell.items.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      {cell.items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContract(item);
                          }}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-bold transition hover:opacity-80 cursor-pointer ${
                            item.type === "EXPIRY"
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                              : item.type === "RENEWAL"
                              ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200"
                              : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          }`}
                          title={`${item.typeLabel}: ${item.contractName}`}
                        >
                          {item.contractName}
                        </div>
                      ))}
                      {cell.items.length > 2 && (
                        <span className="text-[9px] text-[var(--text-muted)] font-bold pl-0.5">
                          +{cell.items.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* 6. Recent Activity Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Recent Portfolio Activity
          </h2>
          <Link
            href="/dashboard/contracts"
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            View all agreements →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="divide-y divide-[var(--border)]">
            {recentActivity.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3.5 transition hover:bg-[var(--surface-muted)]"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <Link
                    href={`/dashboard/contracts/${act.id}`}
                    className="text-xs font-bold text-[var(--foreground)] hover:text-blue-600 transition truncate block"
                  >
                    {act.title}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {act.company} • Updated {act.lastUpdated}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge risk={act.riskLevel as any} />
                  <Link
                    href={`/dashboard/contracts/${act.id}`}
                    className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTRACT DETAILS SIDE PANEL (SLIDE DRAWER) */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          {/* Backdrop click to close */}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setSelectedContract(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-[var(--surface)] shadow-2xl border-l border-[var(--border)] flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-muted)] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                  {selectedContract.contractId}
                </span>
                <h3 className="text-base font-extrabold text-[var(--foreground)] mt-0.5 leading-snug">
                  {selectedContract.contractName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedContract.company} • {selectedContract.contractType}
                </p>
              </div>

              <button
                onClick={() => setSelectedContract(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Status & Risk Badges */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Risk Exposure</span>
                  <div className="mt-1">
                    <RiskBadge risk={selectedContract.riskLevel as any} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Deadline State</span>
                  <span
                    className={`inline-block mt-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      selectedContract.daysRemaining !== null && selectedContract.daysRemaining < 0
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    }`}
                  >
                    {selectedContract.daysRemaining !== null && selectedContract.daysRemaining < 0
                      ? `${Math.abs(selectedContract.daysRemaining)} Days Overdue`
                      : selectedContract.daysRemaining !== null
                      ? `${selectedContract.daysRemaining} Days Remaining`
                      : "Term Unspecified"}
                  </span>
                </div>
              </div>

              {/* Key Contract Dates Grid */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Verified Contract Dates
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Expiry Date</span>
                    <span className="font-mono font-bold text-[var(--foreground)] text-xs">
                      {selectedContract.expiryDate || "Unspecified"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Renewal Date</span>
                    <span className="font-mono font-bold text-[var(--foreground)] text-xs">
                      {selectedContract.renewalDate || "Not applicable"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Start Date</span>
                    <span className="font-mono font-bold text-[var(--foreground)] text-xs">
                      {selectedContract.startDate || "Not specified"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Notice Period</span>
                    <span className="font-medium text-[var(--foreground)] text-xs truncate block" title={selectedContract.noticePeriod || "None"}>
                      {selectedContract.noticePeriod || "None specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Required Action / Urgency */}
              <div className="space-y-1.5 p-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Required Action & Obligation
                </span>
                <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                  {selectedContract.action}
                </p>
              </div>

              {/* Risk Summary / Indicators */}
              {selectedContract.riskIndicators && selectedContract.riskIndicators.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Key Risk Findings
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                    {selectedContract.riskIndicators.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Commercial & Penalty Terms */}
              {(selectedContract.paymentTerms || selectedContract.penaltyInfo) && (
                <div className="space-y-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Financial Terms & Penalties
                  </h4>
                  {selectedContract.paymentTerms && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      <strong className="text-[var(--foreground)]">Payment:</strong> {selectedContract.paymentTerms}
                    </p>
                  )}
                  {selectedContract.penaltyInfo && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      <strong className="text-[var(--foreground)]">Penalty:</strong> {selectedContract.penaltyInfo}
                    </p>
                  )}
                </div>
              )}

              {/* Contract Summary Excerpt */}
              {selectedContract.summary && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Executive Summary
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                    "{selectedContract.summary.slice(0, 220)}..."
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer with Full Page Link */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface)] transition"
              >
                Close Preview
              </button>

              <Link
                href={`/dashboard/contracts/${selectedContract.contractId}`}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
              >
                Open Full Contract Page →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
