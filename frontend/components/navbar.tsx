import Link from "next/link";

import { navItems } from "@/constants/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f5f5f4]/90 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
            IQ
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">ContractIQ</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Legal documentation intelligence</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}