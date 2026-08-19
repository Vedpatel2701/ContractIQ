import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { dashboardMetrics, recentContracts, upcomingDeadlines } from "@/lib/dashboard";

const insightItems = [
  "2 agreements have missing liability caps and should be prioritized for legal review.",
  "Renewal concentration peaks in the next 21 days, with 6 contracts requiring action.",
  "A recurring penalty pattern was detected across 3 vendor templates.",
] as const;

const actionItems = [
  { label: "Upload Contract", href: "/dashboard/contracts/upload" },
  { label: "View Contracts", href: "/dashboard/contracts" },
  { label: "Ask AI", href: "/dashboard/contracts/CON-1042/chat" },
] as const;

const metricToneStyles = {
  positive: "border-emerald-400/15 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/15 bg-amber-400/10 text-amber-200",
  neutral: "border-cyan-400/15 bg-cyan-400/10 text-cyan-200",
} as const;

const statusStyles: Record<string, string> = {
  Active: "border-emerald-400/15 bg-emerald-400/10 text-emerald-200",
  "Review Required": "border-amber-400/15 bg-amber-400/10 text-amber-200",
  Signed: "border-cyan-400/15 bg-cyan-400/10 text-cyan-200",
};

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">ContractIQ</p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">Dashboard Home</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/contracts/upload" variant="primary">
              Upload Contract
            </Button>
            <Button href="#insights" variant="secondary">
              AI Insights
            </Button>
          </div>
        </header>

        <section className="mt-8 space-y-8">
          <PageHeader
            eyebrow="Welcome back"
            title="Your contract portfolio is organized, visible, and ready for review."
            description="Track contract health, watch renewal timelines, and surface risk signals from one centralized workspace."
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <Card key={metric.label} className="bg-[var(--surface)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{metric.value}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${metricToneStyles[metric.tone]}`}>
                    {metric.change}
                  </span>
                </div>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]" id="contracts">
            <Card className="bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Recent Contracts</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">Latest uploaded and reviewed agreements from the active portfolio.</p>
                </div>
                <span className="text-sm text-[var(--text-muted)]">Mock data only</span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                    <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Contract</th>
                        <th className="px-4 py-3 font-medium">Counterparty</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {recentContracts.map((contract) => (
                        <tr key={contract.name} className="transition hover:bg-[var(--surface-muted)]">
                          <td className="px-4 py-4">
                            <p className="font-medium text-[var(--foreground)]">{contract.name}</p>
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">{contract.counterparty}</td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">{contract.type}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[contract.status]}`}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">{contract.renewal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="bg-[var(--surface)] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">Upcoming Deadlines</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Key reminders and renewal milestones for the next few weeks.</p>
                  </div>
                  <span className="rounded-full border border-amber-400/15 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                    3 pending
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                      <div key={deadline.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{deadline.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{deadline.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                          {deadline.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-[var(--surface)] p-6 shadow-sm" id="insights">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">AI Insights</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">High-level contract intelligence derived from the current portfolio.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    Smart summary
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {insightItems.map((insight) => (
                    <div key={insight} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">{insight}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-[var(--surface)] p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Quick Actions</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Common dashboard tasks for fast contract workflow access.</p>

                <div className="mt-6 grid gap-3">
                  {actionItems.map((action) => (
                    <Button key={action.label} href={action.href} variant={action.label === "Upload Contract" ? "primary" : "secondary"}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
