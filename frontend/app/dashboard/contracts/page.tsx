"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { contracts } from "@/lib/contracts";

const statusOptions = ["All", "Active", "Review Required", "Draft", "Expired"] as const;
const riskOptions = ["All", "Low", "Moderate", "High", "Critical"] as const;

const statusStyles: Record<string, string> = {
  Active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Review Required": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Draft: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Expired: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const riskStyles: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  Moderate: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");
  const [risk, setRisk] = useState<(typeof riskOptions)[number]>("All");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setError("");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...contracts]
      .filter((contract) => {
        const matchesSearch =
          !normalizedSearch ||
          contract.name.toLowerCase().includes(normalizedSearch) ||
          contract.company.toLowerCase().includes(normalizedSearch) ||
          contract.id.toLowerCase().includes(normalizedSearch);

        const matchesStatus = status === "All" || contract.status === status;
        const matchesRisk = risk === "All" || contract.riskLevel === risk;

        return matchesSearch && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        const firstDate = new Date(a.lastUpdated).getTime();
        const secondDate = new Date(b.lastUpdated).getTime();

        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "expiry-asc") return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        if (sortBy === "expiry-desc") return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
        return secondDate - firstDate;
      });
  }, [search, status, risk, sortBy]);

  const handleRetry = () => {
    setError("");
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setRisk("All");
    setSortBy("updated-desc");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contracts"
        title="Manage your contract portfolio"
        description="Review contract health, spot risk patterns, and keep your renewal pipeline in sight."
        actions={<Button href="/dashboard/contracts/upload" variant="primary">Upload contract</Button>}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] md:items-end">
          <div>
            <label htmlFor="contract-search" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Search</label>
            <input
              id="contract-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contract, company or ID"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="contract-status" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
            <select
              id="contract-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contract-risk" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Risk</label>
            <select
              id="contract-risk"
              value={risk}
              onChange={(event) => setRisk(event.target.value as (typeof riskOptions)[number])}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500"
            >
              {riskOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contract-sort" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Sort</label>
            <select
              id="contract-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500"
            >
              <option value="updated-desc">Recently updated</option>
              <option value="expiry-asc">Expiry soonest</option>
              <option value="expiry-desc">Expiry latest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={clearFilters} className="text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-300">Clear filters</button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          There was a problem loading contract data.
          <button type="button" onClick={handleRetry} className="ml-2 font-medium underline">Retry</button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-slate-500 dark:text-slate-300">
          Loading contracts...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">No contracts match your filters</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Try changing the search term or reset the filters to see more results.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Contract</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="align-middle">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{contract.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{contract.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{contract.company}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[contract.status]}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${riskStyles[contract.riskLevel]}`}>
                        {contract.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{new Date(contract.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{new Date(contract.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/contracts/${contract.id}`} className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
