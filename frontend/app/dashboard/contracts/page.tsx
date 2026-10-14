"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, RiskBadge } from "@/components/ui/status-badge";
import { fetchContracts, getCurrentUser, type UserRecord } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

const statusOptions = ["All", "Active", "Review Required", "Draft", "Expired"] as const;
const riskOptions = ["All", "Low", "Moderate", "High", "Critical"] as const;

export default function ContractsDirectoryPage() {
  const [contractList, setContractList] = useState<ContractRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");
  const [risk, setRisk] = useState<(typeof riskOptions)[number]>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const loadContractsData = () => {
    setIsLoading(true);
    setErrorMessage(null);
    fetchContracts({ status, risk, search })
      .then((data) => {
        setContractList(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMessage(err?.message || "Failed to load contract directory.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadContractsData();
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

  const hasActiveFilters = search.trim() !== "" || status !== "All" || risk !== "All";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contracts"
        description="Search, filter, and review all agreements analyzed in your workspace."
        actions={
          currentUser?.role !== "VIEWER" ? (
            <Button href="/dashboard/contracts/upload">
              + Analyze Contract
            </Button>
          ) : undefined
        }
      />

      {/* Search & Compact Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between shadow-[var(--shadow-card)]">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)] pointer-events-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contract name, company, or ID..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-1.5 pl-9 pr-3 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-blue-600 focus:bg-[var(--surface)] focus:outline-none transition-colors"
          />
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusOptions)[number])}
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[var(--surface)] text-[var(--foreground)]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Risk:</span>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value as (typeof riskOptions)[number])}
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              {riskOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[var(--surface)] text-[var(--foreground)]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("All");
                setRisk("All");
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition"
            >
              Reset
            </button>
          )}

          <span className="hidden lg:inline-flex items-center rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] border border-[var(--border)]">
            {filteredContracts.length} {filteredContracts.length === 1 ? "agreement" : "agreements"}
          </span>
        </div>
      </div>

      {/* Contract Listing */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : errorMessage ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Unable to load contracts"
          description={errorMessage}
          action={
            <Button variant="outline" size="sm" onClick={loadContractsData}>
              Retry Connection
            </Button>
          }
        />
      ) : contractList.length === 0 ? (
        <EmptyState
          title="No contracts in workspace"
          description="Your contract repository is currently empty. Upload agreements to extract key provisions, detect legal risks, and monitor renewal deadlines."
          action={
            currentUser?.role !== "VIEWER" ? (
              <Button href="/dashboard/contracts/upload" size="sm">
                + Upload Contract
              </Button>
            ) : undefined
          }
        />
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No matching agreements found"
          description={
            search.trim()
              ? `No contracts found matching "${search}" with the active status and risk filters.`
              : "No contracts match the selected status and risk filters."
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("All");
                setRisk("All");
              }}
            >
              Clear Search & Filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          {/* Desktop Column Header */}
          <div className="hidden md:flex items-center px-4 py-2.5 bg-[var(--surface-muted)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <div className="flex-1 min-w-0 pr-6">Contract & Counterparty</div>
            <div className="w-36 shrink-0">Status</div>
            <div className="w-32 shrink-0">Risk</div>
            <div className="w-32 shrink-0">Expiration</div>
            <div className="w-24 shrink-0 text-right">Action</div>
          </div>

          {/* Directory Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="group flex flex-col gap-3 p-3.5 sm:px-4 sm:py-3.5 transition-colors hover:bg-[var(--surface-muted)] md:flex-row md:items-center"
              >
                {/* Column 1: Contract Name & Counterparty */}
                <div className="flex-1 min-w-0 md:pr-6">
                  <Link
                    href={`/dashboard/contracts/${contract.id}`}
                    className="text-sm font-semibold text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {contract.name}
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    {contract.company}
                  </p>
                </div>

                {/* Column 2: Status */}
                <div className="hidden md:flex md:w-36 md:shrink-0 md:items-center">
                  <StatusBadge status={contract.status} />
                </div>

                {/* Column 3: Risk */}
                <div className="hidden md:flex md:w-32 md:shrink-0 md:items-center">
                  <RiskBadge risk={contract.riskLevel} />
                </div>

                {/* Column 4: Expiration */}
                <div className="hidden md:flex md:w-32 md:shrink-0 md:items-center text-xs font-medium text-[var(--foreground)]">
                  {contract.expiryDate || <span className="text-[var(--text-muted)]">—</span>}
                </div>

                {/* Mobile Metadata Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)] md:hidden text-xs">
                  <StatusBadge status={contract.status} />
                  <RiskBadge risk={contract.riskLevel} />
                  <span className="text-[var(--text-secondary)]">
                    Exp: <strong className="text-[var(--foreground)]">{contract.expiryDate || "—"}</strong>
                  </span>
                </div>

                {/* Column 5: Action */}
                <div className="flex shrink-0 items-center justify-between md:justify-end gap-2 md:w-24">
                  <Link
                    href={`/dashboard/assistant?contractId=${contract.id}`}
                    title="Ask AI about this contract"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-blue-400 md:hidden"
                  >
                    <span>💬</span> Chat
                  </Link>
                  <Link
                    href={`/dashboard/contracts/${contract.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                    View <span aria-hidden="true">→</span>
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
