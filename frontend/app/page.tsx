import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="flex flex-1 items-center py-12 sm:py-16 lg:py-20">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
                Simple contract insights for growing teams
              </div>

              <div className="space-y-5">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                  Keep every contract clear and under control.
                </h1>
                <p className="max-w-lg text-lg leading-7 text-[var(--text-secondary)] sm:text-xl">
                  ContractIQ helps legal and business teams organize agreements, spot key risks, and track renewals without complexity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/login" variant="secondary">
                  Open Dashboard
                </Button>
                <Button href="/dashboard/contracts/upload" variant="secondary">
                  Review a Contract
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { value: "1.2k", label: "Contracts tracked" },
                  { value: "94%", label: " visibility" },
                  { value: "24/7", label: "Team access" },
                ].map((stat) => (
                  <Card key={stat.label} className="border border-yellow-200 bg-white  p-5 shadow-sm">
                    <p className="text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Workspace
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Portfolio overview</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">42 active contracts</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      7 needs review
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Renewals", "11 due in 90 days"],
                      ["Risk items", "4 high-priority clauses"],
                      ["Penalties", "3 critical obligations"],
                      ["Alerts", "Daily reminder summaries"],
                    ].map(([title, detail]) => (
                      <div key={title} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Clause scan", description: "Review legal language in seconds." },
                    { title: "Renewal tracker", description: "Always know what is coming next." },
                    { title: "Risk summary", description: "Spot issues before they become problems." },
                  ].map((feature) => (
                    <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-900">{feature.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="features" className="grid gap-4 border-t border-slate-200 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Risk visibility", "Surface critical clauses and obligations at a glance."],
            ["Renewal awareness", "Keep every upcoming date visible before it becomes urgent."],
            ["Clause clarity", "Turn dense agreements into structured review signals."],
            ["Team-ready workflow", "Give legal and business teams one shared operating view."],
          ].map(([title, description]) => (
            <Card key={title} className="border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Card>
          ))}
        </section>

        <section id="security" className="grid gap-8 border-t border-slate-200 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">How ContractIQ works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">From document to decision in three clear steps.</h2>
          </div>
          <div className="space-y-4">
            {["Add agreements to a shared workspace.", "Review structured summaries, risks, and key dates.", "Use reminders and AI analysis to prioritize the next action."].map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{index + 1}</span><p className="pt-1 text-sm leading-6 text-slate-700">{step}</p></div>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-slate-200 py-16">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white sm:p-10"><p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">Built for focused teams</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold">A calmer way to keep legal work moving.</h2><p className="mt-3 max-w-xl text-slate-300">Start with the prototype workspace today and shape the workflow around the contracts your team actually manages.</p><div className="mt-6"><Button href="/login" variant="primary" className="dark:bg-cyan-400">Open the workspace</Button></div></div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
