"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge } from "@/components/ui/status-badge";
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
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" />
          ))}
        </div>
      </div>
    );
  }

  // 1. FIRST-TIME USER EMPTY STATE
  if (totalContracts === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contract Intelligence Workspace"
          description="Upload contracts to extract key terms, identify potential legal risks, track renewal deadlines, and ask questions."
        />

        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">No contracts uploaded yet</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            Start by uploading your first contract. ContractIQ will automatically analyze the document, extract key clauses, identify risks, and enable AI Q&A.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button href="/dashboard/contracts/upload" size="lg">
              + Upload Your First Contract
            </Button>
            <Button href="/#workflow" variant="outline" size="lg">
              See How It Works
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-2xl gap-4 border-t border-[var(--border)] pt-8 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">1. Upload</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">PDF, DOCX, or scanned documents up to 10 MB.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">2. Instant Review</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Key terms, dates, and risk flags extracted automatically.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">3. Ask Assistant</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Ask questions with exact contract source citations.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 2. ACTIVE WORKSPACE DASHBOARD
  return (
    <div className="space-y-6">
      {/* Welcome & Primary CTA Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-6 dark:from-blue-950/20 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Contract Intelligence Workspace
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
            Extract key terms, identify potential legal risks, track renewal deadlines, and ask questions with source citations.
          </p>
        </div>
        <Button href="/dashboard/contracts/upload" size="lg" className="shrink-0">
          + Analyze a Contract
        </Button>
      </div>

      {/* 4 High-Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total Contracts</span>
            <span className="text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{totalContracts}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Active in portfolio</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Needs Attention</span>
            <span className="text-amber-600 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">{needsAttention}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Require review or sign-off</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Upcoming Renewals</span>
            <span className="text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{upcomingRenewals}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">With renewal deadlines</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">High-Risk Contracts</span>
            <span className="text-rose-600 dark:text-rose-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">{highRiskContracts}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Elevated exposure identified</p>
        </Card>
      </div>

      {/* Main Workspace Split: Recent Contracts & Approaching Deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Contracts Table */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">Recent Contracts</h2>
              <p className="text-xs text-[var(--text-secondary)]">Recently uploaded and analyzed agreements</p>
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
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="font-semibold text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {contract.name}
                      </Link>
                      <StatusBadge status={contract.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>{contract.company}</span>
                      <span>•</span>
                      <span>{contract.contractType}</span>
                      <span>•</span>
                      <span>ID: {contract.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <RiskBadge risk={contract.riskLevel} />
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-strong)]"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Deadlines & Action Items */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Upcoming Deadlines</h2>
            <p className="text-xs text-[var(--text-secondary)]">Renewal and notice windows to track</p>
          </div>

          <Card className="space-y-3">
            {contracts
              .filter((c) => Boolean(c.renewalDate))
              .slice(0, 4)
              .map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{c.name}</p>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Renewal
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Renewal Date: <span className="font-medium text-[var(--foreground)]">{c.renewalDate}</span>
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Notice: {c.noticePeriod || "30 days required"}
                  </p>
                </div>
              ))}

            <Link
              href="/dashboard/notifications"
              className="block pt-2 text-center text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              View all notifications & alerts →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
