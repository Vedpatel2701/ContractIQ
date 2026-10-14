"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser, fetchUsers, updateUserRole, type UserRecord } from "@/lib/api";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [securityNotice, setSecurityNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.role === "ADMIN") {
      setLoadingUsers(true);
      fetchUsers()
        .then((data) => {
          setUsers(data);
          setLoadingUsers(false);
        })
        .catch(() => {
          setLoadingUsers(false);
        });
    }

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdateMsg(null);
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role, can_delete: updated.can_delete } : u)));
      setRoleUpdateMsg({ type: "success", text: `Successfully updated ${updated.full_name}'s role to ${updated.role}.` });
    } catch (err: any) {
      setRoleUpdateMsg({ type: "error", text: err?.message || "Failed to update role." });
    }
  };

  const handleToggleDeletePermission = async (userId: string, canDelete: boolean) => {
    setRoleUpdateMsg(null);
    try {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;
      const updated = await updateUserRole(userId, targetUser.role, canDelete);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, can_delete: updated.can_delete } : u)));
      setRoleUpdateMsg({
        type: "success",
        text: `Updated contract deletion permissions for ${updated.full_name}.`,
      });
    } catch (err: any) {
      setRoleUpdateMsg({ type: "error", text: err?.message || "Failed to update permissions." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace Preferences & Access Control"
        description="Adjust how your legal operations workspace behaves, manage team roles, and configure notifications."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Appearance */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-semibold text-[var(--foreground)]">Appearance</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Choose the workspace theme used on this device.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem("contractiq-theme");
                window.location.reload();
              }}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            >
              Use system
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-semibold text-[var(--foreground)]">Notifications & Reminders</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Manage automated deadline alerts and contract renewal schedules.</p>
          <div className="mt-4 space-y-3 text-xs">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-[var(--foreground)] font-medium">Email notification preference</span>
              <input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} className="rounded" />
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-[var(--foreground)] font-medium">Deadline reminder preference</span>
              <input type="checkbox" checked={deadlineReminders} onChange={(event) => setDeadlineReminders(event.target.checked)} className="rounded" />
            </label>
          </div>
        </section>

        {/* User Management & RBAC Panel */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-sm text-[var(--foreground)]">User Management & Role-Based Access Control</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {currentUser?.role === "ADMIN"
                  ? "As an Administrator, you can view all registered workspace members and assign roles or delete permissions."
                  : `Your assigned role: ${currentUser?.role || "Team Member"}. Role modifications are restricted to Workspace Administrators.`}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              currentUser?.role === "ADMIN"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300"
                : currentUser?.role === "CONTRACT_MANAGER"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {currentUser?.role || "GUEST"}
            </span>
          </div>

          {roleUpdateMsg && (
            <div className={`rounded-lg border p-3 text-xs font-medium ${
              roleUpdateMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            }`}>
              {roleUpdateMsg.text}
            </div>
          )}

          {currentUser?.role === "ADMIN" ? (
            <div className="space-y-3">
              {loadingUsers ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] animate-pulse">
                  Loading workspace team members...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-bold uppercase text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-2.5">User</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Assigned Role</th>
                        <th className="px-4 py-2.5">Contract Deletion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {users.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-[var(--surface-muted)]/50 transition">
                            <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                              {u.full_name} {isSelf && <span className="ml-1 text-[10px] text-blue-600 font-normal">(You)</span>}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">{u.email}</td>
                            <td className="px-4 py-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                disabled={isSelf}
                                aria-label={`Role for ${u.full_name}`}
                                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] focus:border-blue-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="CONTRACT_MANAGER">CONTRACT_MANAGER</option>
                                <option value="VIEWER">VIEWER</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              {u.role === "ADMIN" ? (
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  Full Access (Admin)
                                </span>
                              ) : u.role === "VIEWER" ? (
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  Restricted (Viewer)
                                </span>
                              ) : (
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(u.can_delete)}
                                    onChange={(e) => handleToggleDeletePermission(u.id, e.target.checked)}
                                    className="rounded border-[var(--border)]"
                                  />
                                  <span className="text-[11px] text-[var(--text-secondary)]">
                                    {u.can_delete ? "Explicitly Granted" : "Restricted (Default)"}
                                  </span>
                                </label>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs space-y-2">
              <p className="font-semibold text-[var(--foreground)]">Role Privileges Summary</p>
              <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                {currentUser?.role === "CONTRACT_MANAGER" ? (
                  <>
                    <li>Upload and analyze new contracts in the workspace.</li>
                    <li>View, edit metadata, and ask questions regarding authorized contracts.</li>
                    <li>Contract deletion is restricted to Administrators by default.</li>
                    <li>User role management is restricted to Administrators.</li>
                  </>
                ) : (
                  <>
                    <li>Read-only access to view authorized agreements, summaries, and risk analyses.</li>
                    <li>Ask questions through the AI contract assistant.</li>
                    <li>Cannot upload, edit, or delete contracts.</li>
                    <li>Cannot modify workspace users or assign permissions.</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </section>

        {/* Account Security */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2">
          <p className="font-semibold text-[var(--foreground)]">Account Security</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Authentication, session security, and credential management.</p>
          <button
            type="button"
            onClick={() => setSecurityNotice("Password and role management are securely authenticated via JWT with cryptographic hash verification.")}
            className="mt-3 rounded-md border border-[var(--border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
          >
            Check Security Status
          </button>
          {securityNotice ? <p role="status" className="mt-2.5 text-xs font-medium text-blue-600 dark:text-blue-400">{securityNotice}</p> : null}
        </section>
      </div>
    </div>
  );
}
