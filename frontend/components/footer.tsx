import { footerLinks } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-6">
      <div className="flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 ContractIQ. Built for enterprise legal teams.</p>
        <div className="flex flex-wrap gap-4">
          {footerLinks.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}