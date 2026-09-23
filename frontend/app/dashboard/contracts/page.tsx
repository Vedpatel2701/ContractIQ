"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge } from "@/components/ui/status-badge";
import { fetchContracts } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

const statusOptions = ["All", "Active", "Review Required", "Draft", "Expired"] as const;
const riskOptions = ["All", "Low", "Moderate", "High", "Critical"] as const;

export default function ContractsDirectoryPage() {
  const [contractList, setContractList] = useState<ContractRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");
  const [risk, setRisk] = useState<(typeof riskOptions)[number]>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchContracts({ status, risk, search })
      .then((data) => {
        if (mounted) {
          setContractList(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [status, risk, search]);

  const filteredContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...contractList].filter((contract) => {
      const matchesSearch =
        !normalizedSearch ||
        contract.name.toLowerCase().includes(normalizedSearch) ||
        contract.company.toLowerCase().includes(normalizedSearch) ||
        contract.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus = status === "All" || contract.status === status;
      const matchesRisk = risk === "All" || contract.riskLevel === risk;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [contractList, search, status, risk]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts Directory"
        description="Search, filter, and review all agreements analyzed in your workspace."
        actions={
          <Button href="/dashboard/contracts/upload">
            + Analyze New Contract
          </Button>
        }
      />

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contract name, company, or ID..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusOptions)[number])}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>Risk:</span>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value as (typeof riskOptions)[number])}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] focus:outline-none"
            >
              {riskOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contract Listing */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mt-3 text-base font-bold text-[var(--foreground)]">No matching contracts found</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Try adjusting your search query or status/risk filters.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("All");
                setRisk("All");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="divide-y divide-[var(--border)]">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Info */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="text-base font-bold text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {contract.name}
                    </Link>
                    <StatusBadge status={contract.status} />
                    <RiskBadge risk={contract.riskLevel} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--foreground)]">{contract.company}</span>
                    <span>•</span>
                    <span>{contract.contractType}</span>
                    <span>•</span>
                    <span>Renewal: {contract.renewalDate || "Not specified"}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">ID: {contract.id}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/contracts/${contract.id}/chat`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <span>💬</span> Ask Assistant
                  </Link>
                  <Link
                    href={`/dashboard/contracts/${contract.id}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
