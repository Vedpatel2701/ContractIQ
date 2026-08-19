"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

const acceptedFormats = ["PDF", "DOCX", "TXT", "RTF"];
const maxFileSize = "10 MB";

export default function UploadContractPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setError("Selected file is too large. Please upload a file under 10 MB.");
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/rtf"];

    if (!allowedTypes.includes(file.type) && !/\.(pdf|docx|txt|rtf)$/i.test(file.name)) {
      setError("Unsupported file type. Please choose a PDF, DOCX, TXT, or RTF file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    setUploadComplete(false);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Please choose a file to upload first.");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress(0);
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(progress + 20, 100);
      setUploadProgress(progress);
      if (progress === 100) {
        window.clearInterval(timer);
        setUploading(false);
        setUploadComplete(true);
      }
    }, 250);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Upload"
        title="Upload a contract"
        description="Add a new agreement to your workspace and begin reviewing clauses, obligations, and renewal dates."
      />

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFileSelection(event.dataTransfer.files?.[0] ?? null);
          }}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50"
        >
          <p className="text-lg font-semibold text-[var(--foreground)]">Drag and drop a contract here</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.rtf"
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
          />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-300">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">{acceptedFormats.join(" • ")}</span>
            <span>Max {maxFileSize}</span>
          </div>
        </div>

        {selectedFile ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-[var(--foreground)]">{selectedFile.name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatFileSize(selectedFile.size)}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setUploadComplete(false);
                  setUploadProgress(0);
                  setError("");
                }}
                className="text-sm font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400"
              >
                Remove file
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button href="/dashboard/contracts" variant="secondary" className="!rounded-full">Cancel</Button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || uploadComplete}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {uploading ? "Uploading..." : uploadComplete ? "Uploaded" : "Upload file"}
              </button>
            </div>
          </div>
        ) : null}

        {uploading ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>Upload progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        {uploadComplete ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            Contract uploaded successfully. You can now review the document in <Link href="/dashboard/contracts" className="font-medium underline">the contract list</Link>.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
