import Link from "next/link";
import React from "react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const workflowSteps = [
    {
      step: "01",
      title: "Upload Contract",
      description: "Upload any agreement (PDF, DOCX, TXT, or scanned image). We process and extract the text instantly.",
    },
    {
      step: "02",
      title: "Automated Analysis",
      description: "ContractIQ extracts key metadata, renewal deadlines, notice periods, and commercial payment terms.",
    },
    {
      step: "03",
      title: "AI-Assisted Risk Review",
      description: "Highlight uncapped liabilities, aggressive penalties, missing clauses, and non-standard indemnities.",
    },
    {
      step: "04",
      title: "Ask Contract Assistant",
      description: "Ask natural language questions. Every response includes verified source citations from the document.",
    },
    {
      step: "05",
      title: "Deadline Tracking",
      description: "Stay ahead of renewal cutoffs and termination notice windows with automated alerts.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-blue-50/40 via-transparent to-transparent py-16 dark:from-blue-950/20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
            <span>🛡️ AI-Powered Legal Document Intelligence</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Understand contracts in minutes, <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-400">not hours.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
            Upload any contract to extract key terms, identify potential legal risks, track renewal deadlines, and ask questions with verified source citations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button href="/dashboard/contracts/upload" size="lg">
              Analyze a Contract Now →
            </Button>
            <Button href="/dashboard" variant="outline" size="lg">
              Explore Live Workspace
            </Button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            No complex setup required • Works with PDFs, Word Docs, and scanned agreements
          </p>
        </div>
      </section>

      {/* Primary Workflow Section */}
      <section id="workflow" className="py-16 sm:py-20 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Simple 5-Step Workflow
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Designed around how legal & business teams work
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((item) => (
              <Card key={item.step} className="p-6 space-y-2.5">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  Step {item.step}
                </span>
                <h3 className="text-base font-bold text-[var(--foreground)]">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
              </Card>
            ))}

            {/* Quick Start Card */}
            <Card className="flex flex-col justify-between p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white dark:from-blue-600 dark:to-indigo-800">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-200">Get Started</span>
                <h3 className="text-base font-bold text-white">Ready to analyze an agreement?</h3>
                <p className="text-xs leading-relaxed text-blue-100">
                  Upload a document and receive key clauses, risk scoring, and Q&A immediately.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/dashboard/contracts/upload"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-900 shadow-sm transition hover:bg-blue-50"
                >
                  Analyze a Contract Now →
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section id="security" className="py-16 sm:py-20 bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Source Transparency
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Every answer backed by actual contract text.
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Unlike generic chat tools, ContractIQ never guesses or hallucinates. When you ask questions about payment terms or termination periods, the assistant cites the exact clause and document context.
              </p>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Grounded Retrieval-Augmented Generation (RAG)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> AI-assisted risk indicators with severity tiers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Private, isolated document storage
                </li>
              </ul>
            </div>

            {/* Mock Source Card Preview */}
            <Card className="p-5 space-y-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2.5">
                <span className="font-bold text-[var(--foreground)]">Contract Assistant Response</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--foreground)]">
                &ldquo;Payment is due within 45 days of invoice receipt. Overdue balances incur a late fee of 1.5% per month.&rdquo;
              </p>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-secondary)] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Source Citation</p>
                <p className="font-medium text-[var(--foreground)]">Master Services Agreement • Section 4.2 (Payment Terms)</p>
                <p className="italic text-[11px] text-[var(--text-muted)]">&ldquo;All invoices shall be payable Net 45...&rdquo;</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
