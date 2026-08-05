import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { landingFeatures, landingStats, trustHighlights } from "@/lib/site";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_25%),linear-gradient(180deg,_#020617_0%,_#07111f_45%,_#050816_100%)] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="flex flex-1 items-center py-12 sm:py-16 lg:py-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.08)] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                AI-powered contract intelligence for modern legal teams
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Contract intelligence that turns dense agreements into clear, actionable decisions.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                  ContractIQ helps teams organize agreements, surface risks, monitor renewals, and keep every clause visible in one premium dashboard experience.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/login" variant="primary">
                  Open Dashboard
                </Button>
                <Button href="/upload-contract" variant="secondary">
                  Review a Contract
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {landingStats.map((stat) => (
                  <Card key={stat.label} className="border-white/10 bg-white/5 p-5 backdrop-blur">
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                {trustHighlights.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 bg-white/6 p-0 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
              <div className="border-b border-white/10 bg-slate-950/60 px-6 py-4">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">
                  ContractIQ workspace
                </p>
              </div>
              <div className="space-y-6 p-6">
                <div className="rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/12 via-slate-900 to-slate-950 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Portfolio overview</p>
                      <p className="mt-1 text-2xl font-semibold text-white">42 active contracts</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      7 needs review
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Renewals", "11 due in 90 days"],
                      ["Risk flags", "4 high-priority clauses"],
                      ["Penalty terms", "3 critical obligations"],
                      ["Emails", "Daily reminder summaries"],
                    ].map(([title, detail]) => (
                      <div key={title} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{title}</p>
                        <p className="mt-2 text-base font-medium text-white">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {landingFeatures.map((feature) => (
                    <Card key={feature.title} className="border-white/10 bg-slate-950/60 p-4">
                      <p className="text-sm font-medium text-cyan-200">{feature.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
