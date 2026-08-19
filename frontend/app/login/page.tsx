"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

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

    await new Promise((resolve) => setTimeout(resolve, 900));

    setLoading(false);
    window.localStorage.setItem("contractiq-session", rememberMe ? "remembered" : "active");
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-sm font-semibold text-slate-950">IQ</span>
                <div>
                  <p className="text-lg font-semibold">ContractIQ</p>
                  <p className="text-sm text-slate-300">Legal workspace</p>
                </div>
              </div>

              <div className="mt-14 space-y-6">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">Welcome back</p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight">See the full picture of every agreement.</h1>
                <p className="max-w-sm text-base leading-7 text-slate-300">
                  Centralize your contracts, surface risk signals, and keep renewals on track with a cleaner legal workflow.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Operating view</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold">128</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">+12 this month</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sign in</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Access your workspace</h2>
              </div>
              <ThemeToggle />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">Email</label>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">Password</label>
                  <button type="button" onClick={() => setNotice("Password reset is a frontend-only demo. Please use your mock credentials to continue.")} className="text-left text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
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
                    className={error ? "border-red-400 pr-11 focus:border-red-400 focus:ring-red-500/20" : "pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  Remember me
                </label>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              {notice ? <div role="status" className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">{notice}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {loading ? "Signing in..." : "Login"}
                <span aria-hidden="true" className="text-base leading-none">→</span>
              </button>
            </form>

            <div className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-slate-500 dark:text-slate-400">
              Mock access: any valid email and an 8+ character password will open the dashboard.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
