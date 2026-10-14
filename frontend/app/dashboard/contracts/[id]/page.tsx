"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, RiskBadge, DemoBadge } from "@/components/ui/status-badge";
import { fetchContractById, getAuthToken, getCurrentUser, canDeleteContracts, deleteContract, type UserRecord } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetchContractById(id)
      .then((data) => {
        if (mounted) {
          setContract(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const hasDeletePermission = canDeleteContracts(currentUser);

  const handleDeleteContract = async () => {
    if (!contract || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteContract(contract.id);
      setShowDeleteModal(false);
      router.push("/dashboard/contracts");
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete contract. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/dashboard/contracts"
          backLabel="Contracts"
          title="Contract not found"
          description="The requested agreement could not be located in your workspace."
        />
        <div className="pt-2">
          <Button href="/dashboard/contracts" variant="outline">
            ← Back to Contracts
          </Button>
        </div>
      </div>
    );
  }

  const keyInfoItems = [
    { label: "Contract Type", value: contract.contractType || "Commercial Agreement" },
    { label: "Effective Date", value: contract.startDate || "Not specified" },
    { label: "Expiration Date", value: contract.expiryDate || "Not specified" },
    { 
      label: "Next Renewal Date", 
      value: contract.renewalDate && contract.renewalDate !== "Not applicable" 
        ? contract.renewalDate 
        : contract.renewalDate === "Not applicable" 
        ? "Not applicable (Fixed Term)" 
        : "Not specified" 
    },
    { label: "Notice Period", value: contract.noticePeriod || "Not specified" },
    { label: "Payment Terms", value: contract.paymentTerms || "Standard Terms" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        backHref="/dashboard/contracts"
        backLabel="Contracts"
        title={contract.name}
        description={`Agreement with ${contract.company} • ID: ${contract.id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button href={`/dashboard/assistant?contractId=${contract.id}`} size="md">
              💬 Ask Assistant
            </Button>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/contracts/${contract.id}/file${
                getAuthToken() ? `?token=${encodeURIComponent(getAuthToken()!)}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-semibold rounded-lg shadow-sm transition-all px-4 py-2 text-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              📄 View Document
            </a>
            {hasDeletePermission && (
              <button
                type="button"
                id="delete-contract-trigger"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center justify-center font-semibold rounded-lg shadow-sm transition-all px-4 py-2 text-sm border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70 cursor-pointer"
              >
                🗑️ Delete Contract
              </button>
            )}
          </div>
        }
      />

      {/* Snapshot Header Card */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <DemoBadge isDemo={contract.isDemo} />
            <StatusBadge status={contract.status} />
            <RiskBadge risk={contract.riskLevel} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>Customer: <strong className="text-[var(--foreground)] font-medium">{contract.parties?.customer || "Standard"}</strong></span>
            <span>•</span>
            <span>Vendor: <strong className="text-[var(--foreground)] font-medium">{contract.parties?.vendor || contract.company}</strong></span>
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {keyInfoItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main 2-Column Split */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Summary & Clauses */}
        <div className="space-y-6 lg:col-span-2">
          {/* Executive Summary */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Executive Summary</h2>
            <Card className="p-5">
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                {contract.summary || "This agreement establishes key commercial obligations, service level guidelines, and standard terms."}
              </p>
            </Card>
          </section>

          {/* Extracted Clauses */}
          {contract.clauses && contract.clauses.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Extracted Clauses</h2>
                <span className="text-xs text-[var(--text-muted)]">{contract.clauses.length} Provisions</span>
              </div>

              <div className="space-y-2.5">
                {contract.clauses.map((clause, index) => (
                  <Card key={index} className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Clause {index + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{clause}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right 1 Col: Risk Review & Chat */}
        <div className="space-y-6">
          {/* Risk Review */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Risk Flags</h2>
              <RiskBadge risk={contract.riskLevel} />
            </div>

            {contract.riskIndicators && contract.riskIndicators.length > 0 ? (
              <div className="space-y-2.5">
                {contract.riskIndicators.map((riskItem, index) => (
                  <Card key={index} className="p-3.5 text-xs space-y-1 border-amber-200/60 dark:border-amber-900/40">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Flag #{index + 1}</p>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{riskItem}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-xs text-[var(--text-muted)] text-center">
                No high-risk flags identified in this contract.
              </Card>
            )}
          </section>

          {/* Quick Assistant Access */}
          <Card className="p-4 space-y-2.5 bg-[var(--surface-muted)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Contract Assistant</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ask questions about clauses or liabilities with grounded citations.
            </p>
            <Button href={`/dashboard/contracts/${contract.id}/chat`} variant="outline" size="sm" className="w-full">
              Ask Assistant →
            </Button>
          </Card>
        </div>
      </div>

      {/* Contract Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                ⚠️
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Confirm Contract Deletion</h3>
                <p className="text-xs text-[var(--text-muted)]">Administrative Authorization Required</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 space-y-2 text-xs">
              <p className="text-[var(--foreground)] leading-relaxed">
                You are about to delete agreement:
              </p>
              <div className="font-semibold text-sm text-[var(--foreground)]">
                {contract.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>Contract ID:</span>
                <span className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--foreground)] font-medium">
                  {contract.id}
                </span>
                <span>•</span>
                <span>{contract.company}</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              This action will permanently delete the agreement, all extracted clauses, risk indicators, notification reminders, vector search embeddings, and chat history.
            </p>

            {deleteError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                id="confirm-delete-btn"
                onClick={handleDeleteContract}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
              >
                {isDeleting ? "Deleting Contract..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
