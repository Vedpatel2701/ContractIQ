import Link from "next/link";
import React from "react";

import { navItems } from "@/constants/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-[var(--foreground)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            IQ
          </span>
          <div>
            <span className="text-base font-bold tracking-tight">ContractIQ</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-medium tracking-wide uppercase text-[var(--text-muted)]">
              Legal Intelligence
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-semibold text-[var(--text-secondary)] transition hover:text-blue-600 dark:hover:text-blue-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            Dashboard
          </Link>
          <Button href="/dashboard/contracts/upload" size="sm">
            Analyze Contract →
          </Button>
        </div>
      </div>
    </header>
  );
}