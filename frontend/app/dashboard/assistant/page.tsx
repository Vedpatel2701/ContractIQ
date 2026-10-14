"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fetchContracts,
  fetchChatHistory,
  clearChatHistory,
  sendChatMessage,
  getAuthToken,
  type SourceItem,
  API_BASE_URL,
} from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

const generalStarterQuestions = [
  "What are our upcoming contract deadlines?",
  "Which contracts have high risk ratings?",
  "Explain indemnification in commercial agreements",
  "What is the difference between termination for convenience and for cause?",
];

const contractStarterQuestions = [
  "What is the deadline for this contract?",
  "What is the expiry date, and does this contract renew automatically?",
  "Summarize this contract's main terms and obligations",
  "What are the payment terms and invoicing schedule?",
  "Explain the indemnification obligations in this agreement",
  "Show me the exact source for your answer",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  sources?: SourceItem[];
  show_sources?: boolean;
  created_at?: string | null;
};

function renderFormattedInline(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-[var(--surface-muted)] px-1 py-0.5 font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-[var(--border)]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return (
        <em key={i} className="italic text-[var(--text-secondary)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderMarkdownMessage(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty space
    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // Code blocks
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      elements.push(
        <pre key={`code-${i}`} className="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Markdown Tables
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr.slice(1, -1).split("|").map((c) => c.trim());
        const headerRow = parseRow(tableLines[0]);
        const hasDivider = tableLines[1].replace(/[\s\-:_|]/g, "").length === 0;
        const dataRows = (hasDivider ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-2.5 rounded-xl border border-[var(--border)] shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[var(--surface-muted)] text-[var(--foreground)] border-b border-[var(--border)] font-semibold">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 font-bold text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                      {renderFormattedInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--surface-muted)]/50 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-[12px] text-[var(--foreground)]">
                        {renderFormattedInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-3 mb-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
          {trimmed.replace("### ", "").replace(/^\d+\.\s*/, "")}
        </h4>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm sm:text-base font-bold text-[var(--foreground)] mt-3 mb-1">
          {trimmed.replace("## ", "")}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-base sm:text-lg font-bold text-[var(--foreground)] mt-3 mb-1.5">
          {trimmed.replace("# ", "")}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-3 border-blue-500 pl-3 my-2 text-xs sm:text-[13px] italic text-[var(--text-secondary)] bg-[var(--surface-muted)] py-1.5 rounded-r-lg leading-relaxed">
          {renderFormattedInline(trimmed.replace("> ", ""))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-[var(--foreground)] leading-relaxed pl-1">
          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 mt-0.5">
            {numMatch[1]}
          </span>
          <span className="flex-1">{renderFormattedInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-[var(--foreground)] leading-relaxed pl-1">
          <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
          <span className="flex-1">{renderFormattedInline(trimmed.substring(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed text-[var(--foreground)] my-1">
        {renderFormattedInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function SourceEvidenceSection({
  sources,
  citations,
  showSourcesDefault = false,
}: {
  sources?: SourceItem[];
  citations?: string[];
  showSourcesDefault?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(showSourcesDefault);

  useEffect(() => {
    if (showSourcesDefault) {
      setIsExpanded(true);
    }
  }, [showSourcesDefault]);

  const count = sources?.length || citations?.length || 0;
  if (count === 0) return null;

  const authToken = getAuthToken();

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-2 space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{count} Verified {count === 1 ? "Source" : "Sources"}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-normal">
            ({isExpanded ? "Hide" : "View evidence"})
          </span>
        </button>

        {/* Source quick page pills */}
        <div className="flex flex-wrap gap-1 items-center">
          {sources?.slice(0, 3).map((s, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border)]"
            >
              Page {s.page_number || 1}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="space-y-2 pt-1 animate-fadeIn">
          {sources && sources.length > 0 ? (
            sources.map((src, idx) => {
              const fileBase = src.file_url ? `${API_BASE_URL.replace(/\/api\/v1$/, "")}${src.file_url}` : null;
              const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
              const docLower = (src.document_name || "").toLowerCase();
              const isPdf = docLower.endsWith(".pdf") || (!docLower.endsWith(".docx") && !docLower.endsWith(".txt") && !docLower.endsWith(".png"));
              const isDocx = docLower.endsWith(".docx") || docLower.endsWith(".doc");

              let openUrl = fileBase ? `${fileBase}${tokenParam}` : `/dashboard/contracts/${src.contract_id}`;
              if (isPdf && fileBase && src.page_number && src.page_number > 0) {
                openUrl = `${fileBase}${tokenParam}#page=${src.page_number}`;
              }

              const pageLabel = src.page_number && src.page_number > 0 ? `Page ${src.page_number}` : "Page 1";

              return (
                <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-[var(--foreground)] truncate">{src.document_name}</span>
                      {src.section && (
                        <span className="text-[10px] text-[var(--text-muted)] truncate">({src.section})</span>
                      )}
                      <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                        {pageLabel}
                      </span>
                    </div>

                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
                    >
                      {isPdf ? (
                        <>Open PDF ({pageLabel}) ↗</>
                      ) : isDocx ? (
                        <>View DOCX ↗</>
                      ) : (
                        <>View Source ↗</>
                      )}
                    </a>
                  </div>

                  {isDocx && (
                    <p className="text-[10px] text-[var(--text-muted)] italic">
                      Note: Word documents open in text view; browser page navigation applies to PDFs.
                    </p>
                  )}

                  <blockquote className="border-l-2 border-blue-500 pl-2 text-[11px] text-[var(--text-secondary)] italic font-mono bg-[var(--surface)] py-1 rounded-r leading-relaxed">
                    &quot;{src.excerpt}&quot;
                  </blockquote>
                </div>
              );
            })
          ) : (
            citations?.map((c, i) => (
              <div key={i} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-xs text-[var(--text-secondary)] font-mono">
                {c}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
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

  // Chat message & history states
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

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

  // Load chat history for selected contract or general mode
  useEffect(() => {
    setIsLoadingHistory(true);
    const targetId = selectedContractId && selectedContractId !== "general" ? selectedContractId : "general";

    fetchChatHistory(targetId)
      .then((history) => {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.text,
            citations: m.citations,
            sources: m.sources,
            show_sources: m.show_sources,
            created_at: m.created_at,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load conversation history:", err);
      })
      .finally(() => setIsLoadingHistory(false));
  }, [selectedContractId]);

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

  // Smooth auto-scroll when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering, isLoadingHistory]);

  const selectContext = (id: string) => {
    setSelectedContractId(id);
    setIsDropdownOpen(false);
    setDropdownSearch("");

    if (id === "" || id === "general") {
      setSelectedContract(null);
      router.replace("/dashboard/assistant");
    } else {
      const found = contractList.find((c) => c.id === id) || null;
      setSelectedContract(found);
      router.replace(`/dashboard/assistant?contractId=${id}`);
    }
  };

  const handleClearConversation = async () => {
    const targetId = selectedContractId && selectedContractId !== "general" ? selectedContractId : "general";
    await clearChatHistory(targetId);
    setMessages([]);
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const clientMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-msg-${Date.now()}`;

    const userMessage: Message = {
      id: `user-${clientMessageId}`,
      role: "user",
      text: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsAnswering(true);

    const targetId = selectedContractId && selectedContractId !== "general" ? selectedContractId : "general";

    try {
      const response = await sendChatMessage(targetId, trimmed, clientMessageId);
      const assistantMessage: Message = {
        id: response.id,
        role: "assistant",
        text: response.text,
        citations: response.citations,
        sources: response.sources,
        show_sources: response.show_sources,
        created_at: response.created_at,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: "assistant",
          text: "We encountered an issue communicating with the contract intelligence service. Please verify your connection or try again.",
          show_sources: false,
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeStarters = selectedContract ? contractStarterQuestions : generalStarterQuestions;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contract Assistant"
        description="Source-grounded AI document intelligence for individual agreements or workspace-wide legal analysis."
      />

      {/* Context Selector Header Bar */}
      <Card className="p-3.5 bg-[var(--surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                className="inline-flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition cursor-pointer ${
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
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition cursor-pointer ${
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
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
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
              Mode: Workspace & Legal Concept Intelligence
            </div>
          )}
        </div>
      </Card>

      {/* Main Chat Workspace */}
      <Card className="flex flex-col h-[640px] p-0 overflow-hidden shadow-sm">
        {/* Active Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-2.5 text-xs">
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
            onClick={handleClearConversation}
            disabled={messages.length === 0}
          >
            Clear Conversation
          </Button>
        </div>

        {/* Message History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-xs text-[var(--text-muted)] font-medium">Loading conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {selectedContract ? `Contract Assistant — ${selectedContract.name}` : "Contract Intelligence Assistant"}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedContract
                    ? `Ask about deadlines, renewal terms, liabilities, payment obligations, or specific clauses in ${selectedContract.company}'s agreement.`
                    : "Ask about upcoming workspace deadlines, high-risk agreements, or legal standards in plain English."}
                </p>
              </div>

              {/* Starter Question Pills */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {activeStarters.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-2xs transition hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 text-left cursor-pointer"
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
                  className={`leading-relaxed transition-all ${
                    msg.role === "user"
                      ? "max-w-2xl rounded-2xl px-4 py-2.5 text-sm bg-blue-600 text-white font-medium shadow-2xs"
                      : "max-w-3xl rounded-2xl p-4 sm:p-5 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] space-y-2.5 shadow-2xs text-sm"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Contract Intelligence Assistant
                      </span>
                      {selectedContract && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                          {selectedContract.id}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderMarkdownMessage(msg.text)
                    )}
                  </div>

                  {/* Source Evidence Section: Hidden on routine responses, expanded when requested or toggled */}
                  {msg.role === "assistant" && ((msg.sources && msg.sources.length > 0) || (msg.citations && msg.citations.length > 0)) && (
                    <SourceEvidenceSection
                      sources={msg.sources}
                      citations={msg.citations}
                      showSourcesDefault={Boolean(msg.show_sources)}
                    />
                  )}
                </div>
              </div>
            ))
          )}

          {isAnswering && (
            <div className="flex items-start">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)] flex items-center gap-2.5 shadow-2xs">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Analyzing contract provisions and generating grounded answer...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Multiline Message Composer Form */}
        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5"
          >
            <div className="flex-1 relative rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  selectedContract
                    ? `Ask about deadlines, renewal notice, payment terms for ${selectedContract.name}... (Enter to send, Shift+Enter for newline)`
                    : "Ask about upcoming deadlines, high-risk agreements, or legal terms... (Enter to send, Shift+Enter for newline)"
                }
                disabled={isAnswering}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none max-h-32 leading-relaxed"
              />
            </div>
            <Button
              type="submit"
              disabled={isAnswering || !question.trim()}
              size="md"
              className="shrink-0 flex items-center gap-1.5"
            >
              <span>Send</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
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
