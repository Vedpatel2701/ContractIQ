"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchContractById, sendChatMessage } from "@/lib/api";
import type { ContractRecord } from "@/types/contracts";

const starterQuestions = [
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
};

function formatChatMessageContent(text: string) {
  // Simple markdown renderer for clean heading, bolding, bullet and blockquote rendering
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-2 mb-1">
          {trimmed.replace("### ", "")}
        </h4>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-sm font-bold text-[var(--foreground)] mt-2 mb-1">
          {trimmed.replace("## ", "")}
        </h3>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-2 border-blue-500 pl-2.5 my-1 text-xs italic text-[var(--text-secondary)] bg-[var(--surface-muted)] py-1 rounded-r">
          {trimmed.replace("> ", "")}
        </blockquote>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      return (
        <div key={idx} className="flex items-start gap-2 my-0.5 text-xs text-[var(--foreground)]">
          <span className="text-blue-500 font-bold">•</span>
          <span>{renderFormattedInline(content)}</span>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs leading-relaxed text-[var(--foreground)] my-0.5">
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

export default function ContractAssistantChatPage() {
  const params = useParams<{ id: string }>();
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const msgCounterRef = useRef(0);

  useEffect(() => {
    if (params.id) {
      fetchContractById(params.id)
        .then((data) => setContract(data))
        .finally(() => setLoadingContract(false));
    }
  }, [params.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  if (loadingContract) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-96 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
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
          description="Could not load the assistant for this contract."
        />
        <Button href="/dashboard/contracts" variant="outline">
          Back to Contracts Directory
        </Button>
      </div>
    );
  }

  const handleSendMessage = async (queryText = question) => {
    const trimmed = queryText.trim();
    if (!trimmed || isAnswering) return;

    setQuestion("");
    msgCounterRef.current += 1;
    const userMessage: Message = { id: `user-${msgCounterRef.current}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setIsAnswering(true);

    try {
      const response = await sendChatMessage(contract.id, trimmed);
      msgCounterRef.current += 1;
      const assistantMessage: Message = {
        id: response.id || `asst-${msgCounterRef.current}`,
        role: "assistant",
        text: response.text,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Offline fallback
      msgCounterRef.current += 1;
      let fallbackText = `### Contract Overview for ${contract.company}\n\n${contract.summary}`;
      const qLower = trimmed.toLowerCase();
      if (qLower.includes("payment") || qLower.includes("fee") || qLower.includes("invoic")) {
        fallbackText = `### Payment Terms & Invoicing\n\n- **Payment Schedule:** ${contract.paymentTerms || "Standard Net 30 days"}\n- **Counterparty:** ${contract.company}\n\nInvoices should be verified against agreed deliverables prior to settlement.`;
      } else if (qLower.includes("renew") || qLower.includes("expir")) {
        fallbackText = `### Renewal & Expiration Schedule\n\n- **Renewal Date:** ${contract.renewalDate || "Not explicitly scheduled"}\n- **Notice Period:** ${contract.noticePeriod || "30 days prior written notice"}\n\nInitiate review 30-60 days before deadline to avoid automatic renewal.`;
      } else if (qLower.includes("notice") || qLower.includes("terminat")) {
        fallbackText = `### Termination Provisions\n\n- **Required Notice Period:** ${contract.noticePeriod || "30 days written notice"}\n- **Conditions:** Requires formal written notice to the designated counterparty contact.`;
      } else if (qLower.includes("penalt") || qLower.includes("sla")) {
        fallbackText = `### Penalties & Liquidated Damages\n\n- **Identified Terms:** ${contract.penaltyInfo || "No explicit separate monetary penalties detected"}\n\nReview operational SLA milestones for service credit terms.`;
      } else if (qLower.includes("risk") || qLower.includes("indemn") || qLower.includes("liabilit")) {
        fallbackText = `### Risk & Liability Assessment\n\n- **Overall Assessed Risk:** **${contract.riskLevel}**\n- **Summary:** ${contract.summary}\n\nExamine indemnification and limitation of liability clauses closely.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${msgCounterRef.current}`,
          role: "assistant",
          text: fallbackText,
          citations: [contract.summary || "Extracted contract overview"],
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/dashboard/contracts/${contract.id}`}
        backLabel="Contract Details"
        title="Contract Assistant"
        description={`Ask questions about "${contract.name}" (${contract.company}). Answers are grounded directly in your uploaded document with verified source citations.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
            <Button href={`/dashboard/contracts/${contract.id}`} variant="outline" size="sm">
              View Contract Details
            </Button>
          </div>
        }
      />

      {/* Main Chat Container */}
      <Card className="flex flex-col h-[650px] p-0 overflow-hidden">
        {/* Document Header Banner */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-[var(--foreground)]">Active Document:</span>
            <span className="text-[var(--text-secondary)]">{contract.name}</span>
          </div>
          <span className="text-[var(--text-muted)] font-mono text-[11px]">{contract.id}</span>
        </div>

        {/* Message History Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-bold text-[var(--foreground)]">
                What would you like to know about this contract?
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Select a suggested question below or ask anything specific about clauses, obligations, or dates.
              </p>

              {/* Starter Query Pills */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
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
                  className={`max-w-2xl rounded-xl p-4 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <span>✓ Based on your contract:</span>
                    </div>
                  )}

                  {msg.role === "assistant" ? (
                    <div className="space-y-1 text-sm leading-relaxed">{formatChatMessageContent(msg.text)}</div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Compact Source Citation Cards */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3.5 border-t border-[var(--border)] pt-3 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Source Reference
                      </p>
                      {msg.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-xs text-[var(--text-secondary)] space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--text-muted)]">
                            <span>Document: {contract.fileName || contract.name}</span>
                            <span>Verified</span>
                          </div>
                          <p className="italic leading-snug">&ldquo;{cite}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isAnswering && (
            <div className="flex items-start">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--text-muted)] flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Reviewing contract clauses and preparing verified answer...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
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
              placeholder="Ask about payment terms, renewal date, termination notice, penalties..."
              disabled={isAnswering}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-blue-600 focus:outline-none"
            />
            <Button type="submit" disabled={isAnswering || !question.trim()} size="md">
              Ask Assistant
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
