"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [securityNotice, setSecurityNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const storedEmail = window.localStorage.getItem("contractiq-email-notifications");
      const storedDeadlines = window.localStorage.getItem("contractiq-deadline-reminders");
      if (storedEmail) setEmailNotifications(storedEmail === "on");
      if (storedDeadlines) setDeadlineReminders(storedDeadlines === "on");
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("contractiq-email-notifications", emailNotifications ? "on" : "off");
      window.localStorage.setItem("contractiq-deadline-reminders", deadlineReminders ? "on" : "off");
    }
  }, [emailNotifications, deadlineReminders, hydrated]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace preferences"
        description="Adjust how your legal operations workspace behaves and how notifications are delivered."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-medium text-[var(--foreground)]">Appearance</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Choose the workspace theme used on this device.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2"><ThemeToggle /><button type="button" onClick={() => { window.localStorage.removeItem("contractiq-theme"); window.location.reload(); }} className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Use system</button></div>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-medium text-[var(--foreground)]">Notifications</p>
          <div className="mt-4 space-y-4 text-sm"><label className="flex items-center justify-between gap-4"><span>Email notification preference</span><input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} /></label><label className="flex items-center justify-between gap-4"><span>Deadline reminder preference</span><input type="checkbox" checked={deadlineReminders} onChange={(event) => setDeadlineReminders(event.target.checked)} /></label></div>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2">
          <p className="font-medium text-[var(--foreground)]">Account security</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Password and security controls are represented locally in this prototype.</p>
          <button type="button" onClick={() => setSecurityNotice("Password changes are represented locally in this prototype.")} className="mt-4 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium">Change password</button>
          {securityNotice ? <p role="status" className="mt-3 text-sm text-sky-700 dark:text-sky-300">{securityNotice}</p> : null}
        </section>
      </div>
    </div>
  );
}
