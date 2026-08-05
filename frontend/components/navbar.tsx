import Link from "next/link";

import { navItems } from "@/constants/navigation";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
            IQ
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">ContractIQ</p>
            <p className="text-xs text-slate-400">Legal documentation intelligence</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm text-slate-300 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}