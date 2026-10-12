import React from "react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const coreFeatures = [
    {
      title: "Clause & Term Extraction",
      description:
        "Automatically process contracts in PDF, DOCX, or scanned formats into clear structured summaries and key commercial dates.",
      tag: "Extraction",
    },
    {
      title: "Risk & Renewal Tracking",
      description:
        "Spot uncapped liabilities, non-standard penalty terms, and upcoming renewal notice cutoff windows before they elapse.",
      tag: "Risk & Deadlines",
    },
    {
      title: "Verified Document Q&A",
      description:
        "Ask natural language questions about agreements and receive precise answers backed by verified contract text citations.",
      tag: "Grounded RAG",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      {/* Minimal Hero Section */}
      <section className="relative border-b border-[var(--border)] bg-[var(--surface)] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-6 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Contract Intelligence Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl leading-[1.12]">
            Understand contracts in minutes, <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-400">not hours.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg leading-relaxed">
            Extract essential terms, review legal risk indicators, track renewal deadlines, and query commercial agreements with verified document citations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button href="/login" size="lg">
              Get Started →
            </Button>
            <Button href="/login" variant="outline" size="lg">
              Sign In
            </Button>
          </div>

          <p className="text-xs text-[var(--text-muted)] pt-1">
            Works with PDFs, Word documents, and scanned agreements • Private and isolated storage
          </p>
        </div>
      </section>

      {/* Minimal 3-Feature Section */}
      <section id="workflow" className="py-16 sm:py-20 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Engineered for legal clarity without the complexity
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {coreFeatures.map((feat) => (
              <Card key={feat.title} className="p-6 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {feat.tag}
                </span>
                <h3 className="text-base font-bold text-[var(--foreground)]">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{feat.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Verified Citation Section */}
      <section id="security" className="py-16 sm:py-20 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Source Citations
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Every answer backed by verified document text.
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                ContractIQ provides exact clause text citations from your uploaded agreement when answering questions about notice windows, liability caps, or payment obligations.
              </p>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Grounded Retrieval-Augmented Generation (RAG)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> AI-assisted risk indicators with severity tiers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Role-based access control (Admin, Manager, Viewer)
                </li>
              </ul>
            </div>

            {/* Clean Source Context Card */}
            <Card className="p-5 space-y-3 bg-[var(--surface-muted)]">
              <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2.5">
                <span className="font-bold text-[var(--foreground)]">Assistant Response</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Verified Citation
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--foreground)] font-medium">
                &ldquo;Payment is due within 45 days of invoice receipt. Overdue balances incur a late fee of 1.5% per month.&rdquo;
              </p>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-secondary)] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Source Context</p>
                <p className="font-semibold text-[var(--foreground)]">Master Services Agreement • Section 4.2 (Payment Terms)</p>
                <p className="italic text-[11px] text-[var(--text-muted)]">&ldquo;All invoices shall be payable Net 45...&rdquo;</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Clean Call to Action Banner */}
      <section className="py-14 bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 sm:p-10 text-center text-white space-y-4 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to review your contracts?
            </h2>
            <p className="mx-auto max-w-lg text-sm text-slate-300">
              Access the demo workspace to review commercial agreements, check risk exposure, and track renewal deadlines.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button href="/login" size="md">
                Get Started →
              </Button>
              <Button href="/login" variant="outline" size="md" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
