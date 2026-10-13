"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/status-badge";
import { fetchContracts } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

export default function DashboardOverviewPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts()
      .then((contractsData) => {
        setContracts(contractsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalContracts = contracts.length;
  const needsAttention = contracts.filter(
    (c) => c.status === "Review Required" || c.riskLevel === "High" || c.riskLevel === "Critical"
  ).length;
  const upcomingRenewals = contracts.filter((c) => Boolean(c.renewalDate)).length;
  const highRiskContracts = contracts.filter(
    (c) => c.riskLevel === "High" || c.riskLevel === "Critical"
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" />
          ))}
        </div>
      </div>
    );
  }

  // First-time empty state
  if (totalContracts === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Contract Intelligence Overview"
          description="Upload contracts to extract key terms, identify potential legal risks, track renewal deadlines, and ask questions."
          actions={
            <Button href="/dashboard/contracts/upload">
              + Analyze Contract
            </Button>
          }
        />

        <Card className="p-12 text-center space-y-4 max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">No contracts analyzed yet</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Upload commercial agreements in PDF, Word, or scanned document formats to begin automatic analysis and risk extraction.
          </p>
          <div className="pt-2">
            <Button href="/dashboard/contracts/upload">
              Upload an Agreement →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Title & Action Button */}
      <PageHeader
        eyebrow="Workspace"
        title="Contract Intelligence Overview"
        description="Monitor portfolio health, surface liability exposures, and stay ahead of upcoming renewal notice cutoffs."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button href="/dashboard/assistant" variant="outline" size="md">
              💬 Assistant
            </Button>
            <Button href="/dashboard/contracts/upload" size="md">
              + Analyze Contract
            </Button>
          </div>
        }
      />

      {/* 4 High-Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Total Contracts
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{totalContracts}</p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Active in portfolio</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Needs Attention
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400">{needsAttention}</p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Review or exposure flags</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Upcoming Renewals
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{upcomingRenewals}</p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">With renewal deadlines</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              High-Risk Contracts
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-rose-700 dark:text-rose-400">{highRiskContracts}</p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Elevated exposure identified</p>
        </Card>
      </div>

      {/* Main Workspace Split: Recent Contracts & Approaching Deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Minimal Recent Contracts Table */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Contracts</h2>
              <p className="text-xs text-[var(--text-secondary)]">Recently analyzed agreements</p>
            </div>
            <Link
              href="/dashboard/contracts"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all ({totalContracts}) →
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="divide-y divide-[var(--border)]">
              {contracts.slice(0, 5).map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="font-semibold text-sm text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                    >
                      {contract.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)] truncate">
                      {contract.company}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge risk={contract.riskLevel} />
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Deadlines & Action Items */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Upcoming Deadlines</h2>
            <p className="text-xs text-[var(--text-secondary)]">Renewal and notice windows</p>
          </div>

          <Card className="space-y-2 p-3.5">
            {contracts
              .filter((c) => Boolean(c.renewalDate) && c.renewalDate !== "Not applicable" && c.renewalDate !== "None")
              .slice(0, 4)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="text-xs font-semibold text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                    >
                      {c.name}
                    </Link>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {c.company}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    {c.renewalDate}
                  </span>
                </div>
              ))}

            <Link
              href="/dashboard/notifications"
              className="block pt-1.5 text-center text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View all notifications & alerts →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
