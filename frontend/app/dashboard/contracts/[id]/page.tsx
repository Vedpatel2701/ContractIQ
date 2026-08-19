import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { getContractById } from "@/lib/contracts";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = getContractById(id);

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Contract"
          title="Contract not found"
          description="This agreement could not be located in the current workspace."
        />
        <Link href="/dashboard/contracts" className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
          Back to contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contract overview"
        title={contract.name}
        description={contract.summary}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/contracts/${contract.id}/chat`} className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950">
              Ask AI
            </Link>
            <Link href="/dashboard/contracts" className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm">
              Back to contracts
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Overview</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Contract snapshot</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {contract.status}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Customer", contract.parties.customer],
                ["Vendor", contract.parties.vendor],
                ["Contract type", contract.contractType],
                ["Risk level", contract.riskLevel],
                ["Legal owner", contract.parties.legalOwner],
                ["Start date", new Date(contract.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                ["Renewal date", new Date(contract.renewalDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                ["Notice period", contract.noticePeriod],
                ["Expiry date", new Date(contract.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                ["Last updated", new Date(contract.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Important clauses</h2>
            <div className="mt-5 space-y-3">
              {contract.clauses.map((clause) => (
                <div key={clause} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <p className="text-sm font-medium text-[var(--foreground)]">Clause review</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{clause}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Commercial terms</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Payment terms</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{contract.paymentTerms}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Penalty info</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{contract.penaltyInfo}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Risk indicators</h2>
            <div className="mt-5 space-y-3">
              {contract.riskIndicators.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">AI summary</h2>
            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                AI-generated summary placeholder: the agreement is operationally stable but should be reviewed for renewal timing, liability balance, and business continuity language before the next renewal cycle.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Next actions</h2>
            <div className="mt-5 space-y-3">
              {[
                "Confirm renewal notice timeline",
                "Validate indemnity and penalty limits",
                "Review data residency obligations",
              ].map((action) => (
                <div key={action} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-cyan-400 dark:text-slate-950">✓</span>
                  {action}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
