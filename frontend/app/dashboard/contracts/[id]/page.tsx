import React from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge } from "@/components/ui/status-badge";
import { fetchContractById } from "@/lib/api";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = await fetchContractById(id);

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/dashboard/contracts"
          backLabel="Contracts Directory"
          title="Contract not found"
          description="The requested agreement could not be located."
        />
        <Button href="/dashboard/contracts" variant="outline">
          Back to Contracts Directory
        </Button>
      </div>
    );
  }

  const keyInfoItems = [
    { label: "Contract Type", value: contract.contractType || "Commercial Agreement" },
    { label: "Effective Date", value: contract.startDate || "Not specified" },
    { label: "Expiry Date", value: contract.expiryDate || "Not specified" },
    { label: "Renewal Date", value: contract.renewalDate || "Not specified" },
    { label: "Notice Period", value: contract.noticePeriod || "Not specified" },
    { label: "Payment Terms", value: contract.paymentTerms || "Standard Terms" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header with Breadcrumbs & Primary Actions */}
      <PageHeader
        backHref="/dashboard/contracts"
        backLabel="Contracts"
        title={contract.name}
        description={`Analyzed agreement with ${contract.company} • File: ${contract.fileName || "Uploaded Document"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button href={`/dashboard/contracts/${contract.id}/chat`} size="md">
              💬 Ask Contract Assistant
            </Button>
          </div>
        }
      />

      {/* Snapshot Header Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Status:</span>
            <StatusBadge status={contract.status} />
            <span className="text-xs font-semibold text-[var(--text-secondary)] ml-2">Risk Rating:</span>
            <RiskBadge risk={contract.riskLevel} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span>Customer: <strong className="text-[var(--foreground)]">{contract.parties.customer}</strong></span>
            <span>•</span>
            <span>Vendor: <strong className="text-[var(--foreground)]">{contract.parties.vendor}</strong></span>
            <span>•</span>
            <span>Legal Owner: <strong className="text-[var(--foreground)]">{contract.parties.legalOwner}</strong></span>
          </div>
        </div>

        {/* Key Information 6-Grid */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {keyInfoItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{item.label}</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main 2-Column Split: Summary & Clauses vs Risk Review */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Summary & Key Clauses */}
        <div className="space-y-8 lg:col-span-2">
          {/* Executive Summary */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Executive Summary</h2>
              <span className="text-[11px] text-[var(--text-muted)]">AI-assisted analysis</span>
            </div>
            <Card className="p-5">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {contract.summary || "This agreement establishes key commercial obligations, service level guidelines, and standard terms."}
              </p>
            </Card>
          </section>

          {/* Important Clauses */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Important Clauses</h2>
                <p className="text-xs text-[var(--text-secondary)]">Extracted provisions from the contract text</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {contract.clauses.length} Clauses Extracted
              </span>
            </div>

            <div className="space-y-3">
              {contract.clauses.map((clause, index) => (
                <Card key={index} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Clause #{index + 1}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">Verified from document</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{clause}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Right 1 Col: AI-assisted Risk Review & Assistant Quick-Prompt */}
        <div className="space-y-8">
          {/* Risk Review */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Risk Review</h2>
                <p className="text-xs text-[var(--text-secondary)]">AI-assisted risk identification</p>
              </div>
              <RiskBadge risk={contract.riskLevel} />
            </div>

            <div className="space-y-3">
              {contract.riskIndicators.map((riskItem, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900/60 dark:bg-amber-950/30 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                      !
                    </span>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">
                      Potential issue requiring review
                    </span>
                  </div>
                  <p className="text-amber-950 dark:text-amber-200 leading-relaxed pl-7">
                    {riskItem}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Assistant Quick Action Card */}
          <Card className="p-5 space-y-3 bg-gradient-to-br from-blue-50/50 to-slate-50 dark:from-blue-950/20 dark:to-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Have questions about this contract?</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Ask Contract Assistant to find specific payment clauses, termination rules, or liability terms with exact source citations.
            </p>
            <Button href={`/dashboard/contracts/${contract.id}/chat`} size="sm" className="w-full">
              Open Contract Assistant →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
