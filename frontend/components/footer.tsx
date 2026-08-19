import { footerLinks } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 py-6">
      <div className="flex flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 ContractIQ. Built for simple legal workflows.</p>
        <div className="flex flex-wrap gap-4">
          {footerLinks.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}