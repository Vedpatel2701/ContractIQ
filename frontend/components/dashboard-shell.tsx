"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { dashboardNavItems } from "@/constants/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-lg shadow-sm lg:hidden"
              onClick={() => setMobileNavOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 dark:bg-cyan-400 dark:text-slate-950">
                IQ
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">ContractIQ</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Operations workspace</p>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem("contractiq-session");
                router.push("/login");
              }}
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] lg:block">
          <nav className="space-y-1">
            {dashboardNavItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/login" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 dark:bg-cyan-400 dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.label === "Logout" ? <span aria-hidden="true">↗</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        {mobileNavOpen ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:hidden">
            <nav className="space-y-1">
              {dashboardNavItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/login" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white dark:bg-cyan-400 dark:text-slate-950"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
