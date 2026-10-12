import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractIQ | Contract Management",
  description:
    "Manage agreements, review contract terms, and keep renewal obligations on track.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
      data-theme="light"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">{children}</body>
    </html>
  );
}
