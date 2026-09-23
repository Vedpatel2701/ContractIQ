"use client";

import React, { useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadContractFile, ContractUploadError, type UploadErrorDetail } from "@/lib/api";

const supportedFormats = ["PDF", "DOCX", "TXT", "RTF"];
const maxFileSizeMB = 10;

const analysisSteps = [
  { id: 1, label: "Uploading document" },
  { id: 2, label: "Extracting text & formatting" },
  { id: 3, label: "Analyzing clauses & key terms" },
  { id: 4, label: "Assessing potential legal risks" },
  { id: 5, label: "Preparing contract workspace" },
];

export default function AnalyzeContractPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState<UploadErrorDetail | null>(null);
  const [completedContractId, setCompletedContractId] = useState<string | null>(null);

  const validateAndSelectFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File is too large (${(selected.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is ${maxFileSizeMB} MB.`);
      setErrorDetail(null);
      setFile(null);
      return;
    }

    const validExtensions = /\.(pdf|docx|txt|rtf)$/i;
    if (!validExtensions.test(selected.name)) {
      setErrorMessage("Unsupported file format. Please choose a PDF, DOCX, TXT, or RTF document.");
      setErrorDetail(null);
      setFile(null);
      return;
    }

    setErrorMessage("");
    setErrorDetail(null);
    setFile(selected);
    setCompletedContractId(null);
  };

  const handleStartAnalysis = async () => {
    if (!file) {
      setErrorMessage("Please select a contract document first.");
      setErrorDetail(null);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setErrorDetail(null);
    setCurrentStep(1);

    // Simulated progress steps matching backend activity
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (companyName.trim()) {
        formData.append("company", companyName.trim());
      }

      const result = await uploadContractFile(formData);
      clearInterval(stepInterval);
      setCurrentStep(5);
      setCompletedContractId(result.id);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      if (err instanceof ContractUploadError) {
        setErrorMessage(err.message);
        setErrorDetail(err.detail ?? null);
      } else {
        const message = err instanceof Error ? err.message : "Contract analysis failed. Please try again.";
        setErrorMessage(message);
        setErrorDetail(null);
      }
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/contracts"
        backLabel="Contracts"
        title="Analyze a Contract"
        description="Upload any agreement to automatically extract key terms, identify potential legal risks, and enable AI question answering."
      />

      {/* Upload Box Container */}
      <Card className="p-6 sm:p-8">
        {!isProcessing && !completedContractId ? (
          <div className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                validateAndSelectFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-10 text-center transition-colors hover:border-blue-500"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">
                Drag and drop your contract here
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">or select a file from your computer</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Browse Files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.rtf"
                className="hidden"
                onChange={(e) => validateAndSelectFile(e.target.files?.[0] ?? null)}
              />

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-medium">
                  {supportedFormats.join(" • ")}
                </span>
                <span>Maximum {maxFileSizeMB} MB per file</span>
              </div>
            </div>

            {/* Selected File Details & Optional Metadata */}
            {file && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setErrorMessage("");
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                <div className="border-t border-[var(--border)] pt-3">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Counterparty / Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp (auto-detected if left blank)"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" href="/dashboard/contracts">
                    Cancel
                  </Button>
                  <Button onClick={handleStartAnalysis} size="md">
                    Start Analysis →
                  </Button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 space-y-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-xs font-bold text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                    ✕
                  </span>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                        Document Not Accepted as Legal Contract
                      </h4>
                      {errorDetail?.detected_type && (
                        <span className="rounded-md border border-rose-300 bg-rose-100/80 px-2 py-0.5 text-[11px] font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-900/50 dark:text-rose-200">
                          Detected: {errorDetail.detected_type}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed text-rose-900 dark:text-rose-200">
                      {errorMessage}
                    </p>
                  </div>
                </div>

                {errorDetail?.missing_elements && errorDetail.missing_elements.length > 0 && (
                  <div className="rounded-lg border border-rose-200/80 bg-rose-100/40 p-3 dark:border-rose-900/40 dark:bg-rose-900/20">
                    <p className="font-semibold text-rose-950 dark:text-rose-200 text-[11px] mb-1.5">
                      Missing Contractual Elements:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-rose-800 dark:text-rose-300">
                      {errorDetail.missing_elements.map((elem, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{elem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-rose-200/80 dark:border-rose-900/60 pt-3 text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
                  <p className="font-semibold text-rose-950 dark:text-rose-200">Accepted Document Types:</p>
                  <p>Legal contracts, Non-Disclosure Agreements (NDAs), Employment Agreements, Master Services Agreements (MSAs), Leases, MOUs, Licensing Agreements, SOWs, and Consulting Contracts.</p>
                  <p className="font-medium text-rose-700 dark:text-rose-400">Rejected: Academic certificates, marksheets, transcripts, resumes/CVs, invoices, news, essays, or personal IDs.</p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Processing State with Step-by-Step Indicator */}
        {isProcessing && !completedContractId && (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Analyzing &quot;{file?.name}&quot;
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Our AI pipeline is reading clauses, extracting terms, and evaluating potential risks.
              </p>
            </div>

            {/* Steps Progress */}
            <div className="mx-auto max-w-md space-y-2.5 text-left">
              {analysisSteps.map((step) => {
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-xs font-medium transition-colors ${
                      isComplete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : isCurrent
                        ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] opacity-60"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                      {isComplete ? "✓" : step.id}
                    </span>
                    <span>{step.label}</span>
                    {isCurrent && <span className="ml-auto text-[10px] animate-pulse font-semibold">Processing...</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Success State */}
        {completedContractId && (
          <div className="space-y-6 py-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Contract Analysis Complete!
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Key terms, renewal dates, important clauses, and potential risks have been extracted.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button href={`/dashboard/contracts/${completedContractId}`} size="lg">
                View Contract Analysis & Risks →
              </Button>
              <Button href="/dashboard/contracts" variant="outline" size="lg">
                Go to Contracts Directory
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
