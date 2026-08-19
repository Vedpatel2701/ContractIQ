"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getContractById } from "@/lib/contracts";

const starterQuestions = [
  "What is the renewal date?",
  "What is the termination notice period?",
  "What penalties are mentioned?",
];

type Message = { id: number; role: "user" | "assistant"; text: string };

export default function ContractChatPage() {
  const params = useParams<{ id: string }>();
  const contract = getContractById(params.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!contract) {
    return <div className="space-y-4"><PageHeader eyebrow="AI chat" title="Contract not found" description="This agreement is not available in the mock workspace." /><Link href="/dashboard/contracts" className="text-sm font-medium text-sky-600 dark:text-sky-400">Back to contracts</Link></div>;
  }

  const sendMessage = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    const answer = trimmed.toLowerCase().includes("renewal")
      ? `The renewal date listed for this agreement is ${new Date(contract.renewalDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}.`
      : trimmed.toLowerCase().includes("notice")
        ? contract.penaltyInfo
        : `The mock analysis highlights these terms: ${contract.penaltyInfo}`;

    setQuestion("");
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: trimmed }]);
    setLoading(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: answer }]);
      setLoading(false);
    }, 700);
  };

  const clearChat = () => {
    setMessages([]);
    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI contract chat · mock analysis" title={contract.name} description="Ask questions about this contract. Responses are simulated for the frontend prototype." actions={<div className="flex items-center gap-3"><button type="button" onClick={clearChat} disabled={messages.length === 0 && !question} className="text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300">Clear chat</button><Link href={`/dashboard/contracts/${contract.id}`} className="text-sm font-medium text-sky-600 dark:text-sky-400">Back to details</Link></div>} />

      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4"><p className="text-sm font-medium text-[var(--foreground)]">ContractIQ analysis assistant</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mock responses only · no external AI service is connected</p></div>
        <div className="min-h-[320px] space-y-4 p-5">
          {messages.length === 0 ? <div className="flex min-h-[250px] flex-col items-center justify-center text-center"><p className="font-medium text-[var(--foreground)]">What would you like to know?</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Start with a suggested question or ask about a specific clause.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{starterQuestions.map((item) => <button key={item} type="button" onClick={() => sendMessage(item)} className="rounded-full border border-[var(--border)] px-3 py-2 text-xs text-slate-600 transition hover:border-cyan-500 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-300">{item}</button>)}</div></div> : messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-slate-900 text-white dark:bg-cyan-400 dark:text-slate-950" : "border border-cyan-500/20 bg-cyan-500/5 text-[var(--foreground)]"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">{message.role === "user" ? "You" : "AI analysis"}</p>{message.text}</div></div>)}
          {loading ? <div className="text-sm text-slate-500 dark:text-slate-400">Reviewing the mock contract analysis...</div> : null}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
        <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex gap-3 border-t border-[var(--border)] p-5"><Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about renewal, notice, penalties..." aria-label="Ask a question about the contract" /><Button type="submit" disabled={loading || !question.trim()}>Send</Button></form>
      </section>
    </div>
  );
}
