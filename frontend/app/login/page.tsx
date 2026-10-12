"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginUser } from "@/lib/api";


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setNotice("");
    setLoading(true);

    try {
      await loginUser(email, password);
      window.localStorage.setItem("contractiq-session", rememberMe ? "remembered" : "active");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)] lg:grid-cols-[1.1fr_1fr]">
          {/* Left Brand Identity Panel */}
          <div className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between border-r border-slate-800">
            <div>
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-sm text-white shadow-sm">
                    IQ
                  </span>
                  <div>
                    <p className="text-base font-bold tracking-tight text-white">ContractIQ</p>
                    <p className="text-xs text-slate-400">Legal Intelligence Platform</p>
                  </div>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  ← Home
                </Link>
              </div>

              <div className="mt-14 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>Enterprise Contract Operations</span>
                </div>
                <h1 className="max-w-md text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Clear visibility across every legal agreement.
                </h1>
                <p className="max-w-sm text-sm leading-relaxed text-slate-300">
                  Extract key clauses, surface uncapped liabilities, track renewal notice windows, and query agreements with verified citations.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Verified Citations</p>
                  <p className="text-[11px] leading-snug">Answers grounded in actual contract clause text.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Role-Based Access</p>
                  <p className="text-[11px] leading-snug">Admin, Manager, and Viewer governance tiers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Form Panel */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Sign In</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">Access your workspace</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] lg:hidden"
                  >
                    ← Home
                  </Link>
                  <ThemeToggle />
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Work Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    aria-invalid={Boolean(error)}
                    className={error ? "border-red-400 focus:border-red-400 focus:ring-red-500/20" : ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setNotice("Please use the demo credentials below to sign in.")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      aria-invalid={Boolean(error)}
                      className={error ? "border-red-400 pr-12 focus:border-red-400 focus:ring-red-500/20" : "pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border-strong)] accent-blue-600"
                    />
                    Remember this session
                  </label>
                </div>

                {error ? (
                  <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 text-xs font-medium text-[var(--danger-text)]">
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div role="status" className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent)]">
                    {notice}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Sign In to Workspace"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>

            {/* Development / Academic Demonstration Credentials Helper */}
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Development Demo Accounts
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Click to select
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@gmail.com");
                    setPassword("admin123");
                    setError("");
                    setNotice("");
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-left hover:border-blue-500 hover:bg-[var(--accent-soft)] transition cursor-pointer"
                >
                  <p className="font-bold text-[var(--foreground)] text-xs">Admin</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">admin@gmail.com</p>
                  <p className="text-[10px] font-mono text-[var(--accent)] font-semibold">admin123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("manager@gmail.com");
                    setPassword("manager123");
                    setError("");
                    setNotice("");
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-left hover:border-blue-500 hover:bg-[var(--accent-soft)] transition cursor-pointer"
                >
                  <p className="font-bold text-[var(--foreground)] text-xs">Manager</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">manager@gmail.com</p>
                  <p className="text-[10px] font-mono text-[var(--accent)] font-semibold">manager123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("viewer@gmail.com");
                    setPassword("viewer123");
                    setError("");
                    setNotice("");
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-left hover:border-blue-500 hover:bg-[var(--accent-soft)] transition cursor-pointer"
                >
                  <p className="font-bold text-[var(--foreground)] text-xs">Viewer</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">viewer@gmail.com</p>
                  <p className="text-[10px] font-mono text-[var(--accent)] font-semibold">viewer123</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
