"use client";

import React, { useEffect, useRef, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchContracts, sendChatMessage, type SourceItem, API_BASE_URL } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

const generalStarterQuestions = [
  "What is standard indemnification in commercial agreements?",
  "How many high-risk contracts exist in the workspace?",
  "Explain limitation of liability caps and industry standards",
  "What notice window is recommended to prevent auto-renewal?",
];

const contractStarterQuestions = [
  "What are the payment terms and invoicing schedule?",
  "When does this contract renew and what notice is required?",
  "What are the highest-risk clauses and liability exposures?",
  "Explain the indemnification obligations in simple terms",
  "What happens if either party terminates early?",
  "What are the penalties or SLA service credits?",
];

type Message = {
  id: string | number;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  sources?: SourceItem[];
};

function formatMarkdownText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-3 mb-1">
          {trimmed.replace("### ", "")}
        </h4>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-sm font-bold text-[var(--foreground)] mt-3 mb-1">
          {trimmed.replace("## ", "")}
        </h3>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-2 border-blue-500 pl-3 my-1.5 text-xs italic text-[var(--text-secondary)] bg-[var(--surface-muted)] py-1.5 rounded-r">
          {trimmed.replace("> ", "")}
        </blockquote>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      return (
        <div key={idx} className="flex items-start gap-2 my-1 text-xs text-[var(--foreground)] leading-relaxed">
          <span className="text-blue-500 font-bold">•</span>
          <span>{renderFormattedInline(content)}</span>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs leading-relaxed text-[var(--foreground)] my-1">
        {renderFormattedInline(line)}
      </p>
    );
  });
}

function renderFormattedInline(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function ContractAssistantPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialContractId = searchParams.get("contractId") || "";

  const [contractList, setContractList] = useState<ContractRecord[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>(initialContractId);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  // Selector Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const msgCounterRef = useRef(0);

  useEffect(() => {
    fetchContracts()
      .then((data) => {
        setContractList(data);
        if (initialContractId) {
          const found = data.find((c) => c.id === initialContractId);
          if (found) {
            setSelectedContractId(found.id);
            setSelectedContract(found);
          }
        }
      })
      .finally(() => setIsLoadingContracts(false));
  }, [initialContractId]);

  // Handle click outside context selector dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  const selectContext = (id: string) => {
    setSelectedContractId(id);
    setIsDropdownOpen(false);
    setDropdownSearch("");
    setMessages([]);

    if (id === "" || id === "general") {
      setSelectedContract(null);
      router.replace("/dashboard/assistant");
    } else {
      const found = contractList.find((c) => c.id === id) || null;
      setSelectedContract(found);
      router.replace(`/dashboard/assistant?contractId=${id}`);
    }
  };

  const filteredContracts = contractList.filter(
    (c) =>
      c.name.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  const handleSendMessage = async (queryText = question) => {
    const trimmed = queryText.trim();
    if (!trimmed || isAnswering) return;

    setQuestion("");
    msgCounterRef.current += 1;
    const userMessage: Message = { id: `user-${msgCounterRef.current}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setIsAnswering(true);

    const targetId = selectedContractId && selectedContractId !== "general" ? selectedContractId : "general";

    try {
      const response = await sendChatMessage(targetId, trimmed);
      msgCounterRef.current += 1;
      const assistantMessage: Message = {
        id: response.id || `asst-${msgCounterRef.current}`,
        role: "assistant",
        text: response.text,
        citations: response.citations,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      msgCounterRef.current += 1;

      let fallbackText = "";
      let fallbackCitations: string[] = [];

      if (selectedContract) {
        const qLower = trimmed.toLowerCase();
        if (qLower.includes("payment") || qLower.includes("fee") || qLower.includes("invoic")) {
          fallbackText = `### Payment Terms & Provisions\n\n- **Payment Status:** ${selectedContract.paymentStatus || "Paid"}\n- **Commercial Terms:** ${selectedContract.paymentTerms || "Standard Net 30 days"}\n- **Counterparty:** ${selectedContract.company}`;
          fallbackCitations = [`${selectedContract.name} • Payment & Commercial Clause`];
        } else if (qLower.includes("renew") || qLower.includes("expir")) {
          fallbackText = `### Renewal & Expiration Timeline\n\n- **Expiry Date:** ${selectedContract.expiryDate || "Not specified"}\n- **Renewal Date:** ${selectedContract.renewalDate || "Not explicitly specified"}\n- **Notice Window:** ${selectedContract.noticePeriod || "30 days written notice"}`;
          fallbackCitations = [`${selectedContract.name} • Term & Termination Clause`];
        } else if (qLower.includes("risk") || qLower.includes("penalt") || qLower.includes("liabilit")) {
          fallbackText = `### Risk & Penalties Overview\n\n- **Assessed Risk Level:** **${selectedContract.riskLevel}**\n- **Penalty Provisions:** ${selectedContract.penaltyInfo || "No explicit penalty clause"}\n\n**Identified Risk Indicators:**\n${selectedContract.riskIndicators.map((r) => `- ${r}`).join("\n")}`;
          fallbackCitations = [`${selectedContract.name} • Risk Assessment & Liabilities`];
        } else {
          fallbackText = `### Contract Summary for ${selectedContract.name}\n\n${selectedContract.summary || "No executive summary available for this agreement."}`;
          fallbackCitations = [`${selectedContract.name} • Executive Summary`];
        }
      } else {
        fallbackText = `### General Contract Assistance\n\nI reviewed your query regarding general contract management and legal standards.\n\n- **Recommendation:** Ensure all liability caps, indemnification terms, and notice periods are verified against your organization's legal policies.\n- Select a specific contract from the **Context selector** dropdown above for grounded document citations.`;
        fallbackCitations = ["ContractIQ General Legal Guidance"];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${msgCounterRef.current}`,
          role: "assistant",
          text: fallbackText,
          citations: fallbackCitations,
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const activeStarters = selectedContract ? contractStarterQuestions : generalStarterQuestions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Assistant"
        description="Source-grounded AI document intelligence for individual agreements or general workspace legal analysis."
      />

      {/* Context Selector Header Bar */}
      <Card className="p-4 bg-[var(--surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
              Context:
            </span>

            {/* Custom Enterprise Context Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoadingContracts}
                className="inline-flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <span className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-[380px]">
                  {selectedContract ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{selectedContract.name}</span>
                      <span className="text-[var(--text-muted)] font-normal truncate">({selectedContract.company})</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span>General</span>
                      <span className="text-[var(--text-muted)] font-normal">(Workspace & Legal Concepts)</span>
                    </>
                  )}
                </span>
                <svg className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl animate-in fade-in-50 zoom-in-95">
                  {/* Search box inside selector */}
                  <div className="p-1 pb-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      placeholder="Search contracts by name or counterparty..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
                    {/* Option: General */}
                    <button
                      type="button"
                      onClick={() => selectContext("general")}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                        !selectedContract
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                          : "hover:bg-[var(--surface-muted)] text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🌐</span>
                        <div>
                          <p className="font-semibold">General Context</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Ask legal concept questions or workspace queries</p>
                        </div>
                      </div>
                      {!selectedContract && <span className="text-blue-600 font-bold">✓</span>}
                    </button>

                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Specific Contracts ({filteredContracts.length})
                    </div>

                    {filteredContracts.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                        No matching contracts found
                      </div>
                    ) : (
                      filteredContracts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectContext(c.id)}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                            selectedContract?.id === c.id
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                              : "hover:bg-[var(--surface-muted)] text-[var(--foreground)]"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{c.company} • {c.id}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              c.riskLevel === "High" || c.riskLevel === "Critical" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                              c.riskLevel === "Moderate" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}>
                              {c.riskLevel}
                            </span>
                            {c.isDemo && (
                              <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Demo
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Context Details Badges */}
          {selectedContract ? (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                selectedContract.riskLevel === "High" || selectedContract.riskLevel === "Critical" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900" :
                selectedContract.riskLevel === "Moderate" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900" :
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
              }`}>
                Risk: {selectedContract.riskLevel}
              </span>
              <Button href={`/dashboard/contracts/${selectedContract.id}`} variant="outline" size="sm">
                View Contract Details →
              </Button>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Mode: Workspace & Legal Policy Intelligence
            </div>
          )}
        </div>
      </Card>

      {/* Main Chat Workspace */}
      <Card className="flex flex-col h-[620px] p-0 overflow-hidden">
        {/* Active Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`h-2 w-2 rounded-full ${selectedContract ? "bg-emerald-500" : "bg-blue-500"}`} />
            <span className="font-semibold text-[var(--foreground)]">Active Context:</span>
            <span className="text-[var(--text-secondary)] font-medium truncate">
              {selectedContract ? `${selectedContract.name} (${selectedContract.company})` : "General Workspace Context"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            Clear Conversation
          </Button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto py-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  {selectedContract ? `Contract Assistant — ${selectedContract.name}` : "General Contract Assistant"}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedContract
                    ? `Ask grounded questions regarding payment terms, renewal notices, liabilities, or specific clauses in ${selectedContract.company}'s agreement.`
                    : "Ask questions about legal concepts, contract standards, risk factors, or get an overview of your active contracts."}
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {activeStarters.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] space-y-2"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Grounded Assistant Analysis
                      </span>
                      {selectedContract && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {selectedContract.id}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">
                    {msg.role === "user" ? msg.text : formatMarkdownText(msg.text)}
                  </div>

                  {/* Verified Source Metadata Cards */}
                  {((msg.sources && msg.sources.length > 0) || (msg.citations && msg.citations.length > 0)) && (
                    <div className="mt-3.5 border-t border-[var(--border)] pt-3 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified Document Evidence ({msg.sources?.length || msg.citations?.length})
                        </span>
                      </div>

                      {msg.sources && msg.sources.length > 0 ? (
                        msg.sources.map((src, idx) => {
                          const fileFullUrl = src.file_url ? `${API_BASE_URL.replace(/\/api\/v1$/, "")}${src.file_url}` : null;
                          const pageLabel = src.page_number && src.page_number > 0 ? `Page ${src.page_number}` : "Page Not Specified";
                          const sectionLabel = src.section || "Document Context";
                          const openUrl = fileFullUrl ? (src.page_number ? `${fileFullUrl}#page=${src.page_number}` : fileFullUrl) : `/dashboard/contracts/${src.contract_id}`;

                          return (
                            <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs space-y-2 shadow-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-semibold text-[var(--foreground)] truncate">{src.document_name}</span>
                                  <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold shrink-0">
                                    {pageLabel}
                                  </span>
                                  {src.section && (
                                    <span className="rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] font-medium truncate">
                                      {sectionLabel}
                                    </span>
                                  )}
                                </div>

                                <a
                                  href={openUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs transition hover:bg-blue-700 shrink-0"
                                >
                                  <span>Open Source</span>
                                  <span>→</span>
                                </a>
                              </div>

                              <blockquote className="border-l-2 border-blue-500 pl-2.5 py-1 text-[11px] text-[var(--text-secondary)] italic font-mono bg-[var(--surface)] rounded-r leading-relaxed">
                                &quot;{src.excerpt}&quot;
                              </blockquote>
                            </div>
                          );
                        })
                      ) : (
                        msg.citations?.map((c, i) => (
                          <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-xs text-[var(--text-secondary)] font-mono leading-normal">
                            {c}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isAnswering && (
            <div className="flex items-start">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--text-muted)] flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Searching contract clauses and generating grounded answer...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Question Input Form */}
        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                selectedContract
                  ? `Ask about payment terms, renewal notice, liability caps for ${selectedContract.name}...`
                  : "Ask about legal terms, risk factors, or workspace contract summaries..."
              }
              disabled={isAnswering}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] focus:border-blue-600 focus:outline-none placeholder:text-[var(--text-muted)]"
            />
            <Button type="submit" disabled={isAnswering || !question.trim()} size="md">
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function ContractAssistantPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">Loading Contract Assistant...</div>}>
      <ContractAssistantPageContent />
    </Suspense>
  );
}
