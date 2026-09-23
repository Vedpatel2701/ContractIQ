"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";

import { dashboardNavItems, secondaryNavItems } from "@/constants/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // SVG Icons helper for crisp rendering
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "layout-dashboard":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
        );
      case "file-text":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "upload":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      case "bell":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case "settings":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "user":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight text-[var(--foreground)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
              IQ
            </span>
            <div>
              <span className="text-base font-bold tracking-tight">ContractIQ</span>
              <span className="block text-[10px] font-medium tracking-wide uppercase text-[var(--text-muted)]">
                Legal Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Primary CTA */}
        <div className="p-4">
          <Link
            href="/dashboard/contracts/upload"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Analyze Contract
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Workspace
          </div>
          {dashboardNavItems.map((item) => {
            const isUpload = item.href === "/dashboard/contracts/upload";
            if (isUpload) return null; // Already rendered as primary action

            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className={active ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-muted)]"}>
                  {renderIcon(item.icon)}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Account
          </div>
          {secondaryNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className={active ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-muted)]"}>
                  {renderIcon(item.icon)}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                VP
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-[var(--foreground)]">Ved Patel</p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">Legal Admin</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] lg:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-[var(--foreground)] capitalize">
                {pathname.split("/")[2] || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/contracts/upload"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 lg:hidden"
            >
              + Analyze
            </Link>
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem("contractiq-session");
                router.push("/login");
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="border-b border-[var(--border)] bg-[var(--surface)] p-4 lg:hidden">
            <nav className="space-y-1">
              {dashboardNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
