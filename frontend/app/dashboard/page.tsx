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
  { label: "Upload Contract", href: "/upload-contract" },
  { label: "View Contracts", href: "#contracts" },
  { label: "Chat with AI", href: "#insights" },
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#07111f_45%,_#050816_100%)] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/8 bg-slate-950/70 px-5 py-4 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">ContractIQ</p>
            <p className="mt-1 text-lg font-semibold text-white">Dashboard Home</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href="/upload-contract" variant="primary">
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
              <Card key={metric.label} className="border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${metricToneStyles[metric.tone]}`}>
                    {metric.change}
                  </span>
                </div>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]" id="contracts">
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Contracts</h2>
                  <p className="mt-2 text-sm text-slate-400">Latest uploaded and reviewed agreements from the active portfolio.</p>
                </div>
                <span className="text-sm text-slate-400">Dummy data only</span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/8 text-left text-sm">
                    <thead className="bg-slate-950/60 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Contract</th>
                        <th className="px-4 py-3 font-medium">Counterparty</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-slate-950/40">
                      {recentContracts.map((contract) => (
                        <tr key={contract.name} className="transition hover:bg-white/5">
                          <td className="px-4 py-4">
                            <p className="font-medium text-white">{contract.name}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{contract.counterparty}</td>
                          <td className="px-4 py-4 text-slate-300">{contract.type}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[contract.status]}`}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{contract.renewal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Upcoming Deadlines</h2>
                    <p className="mt-2 text-sm text-slate-400">Key reminders and renewal milestones for the next few weeks.</p>
                  </div>
                  <span className="rounded-full border border-amber-400/15 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                    3 pending
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div key={deadline.title} className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">{deadline.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{deadline.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                          {deadline.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-cyan-400/10 via-slate-950 to-slate-950 p-6 backdrop-blur" id="insights">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">AI Insights</h2>
                    <p className="mt-2 text-sm text-slate-400">High-level contract intelligence derived from the current portfolio.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    Smart summary
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {insightItems.map((insight) => (
                    <div key={insight} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-sm leading-6 text-slate-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                <p className="mt-2 text-sm text-slate-400">Common dashboard tasks for fast contract workflow access.</p>

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
