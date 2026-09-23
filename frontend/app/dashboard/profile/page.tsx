"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("Ved Patel");
  const [organization, setOrganization] = useState("ContractIQ Services");
  const [draftName, setDraftName] = useState(name);
  const [draftOrganization, setDraftOrganization] = useState(organization);

  const startEditing = () => {
    setDraftName(name);
    setDraftOrganization(organization);
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(name);
    setDraftOrganization(organization);
    setEditing(false);
  };

  const saveProfile = () => {
    if (!draftName.trim() || !draftOrganization.trim()) return;
    setName(draftName.trim());
    setOrganization(draftOrganization.trim());
    setEditing(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Legal team profile"
        description="A quick profile snapshot for the workspace owner and assigned contract reviewers."
      />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
            VP
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">{name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Head of Legal Operations</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Name</p>{editing ? <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="mt-2" aria-label="Profile name" /> : <p className="mt-2 text-sm font-medium">{name}</p>}</div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Email</p><p className="mt-2 text-sm font-medium">vedpatel@contractiq.demo</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Organization</p>{editing ? <Input value={draftOrganization} onChange={(event) => setDraftOrganization(event.target.value)} className="mt-2" aria-label="Organization" /> : <p className="mt-2 text-sm font-medium">{organization}</p>}</div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Role</p><p className="mt-2 text-sm font-medium">Head of Legal Operations</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><Button onClick={editing ? cancelEditing : startEditing} variant="secondary">{editing ? "Cancel" : "Edit profile"}</Button>{editing ? <Button onClick={saveProfile} disabled={!draftName.trim() || !draftOrganization.trim()}>Save changes</Button> : null}{saved ? <span role="status" className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved locally.</span> : null}</div>
      </div>
    </div>
  );
}
