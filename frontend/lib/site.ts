import type { LandingFeature, LandingStat } from "@/types/site";

export const landingStats: LandingStat[] = [
  { value: "42", label: "Contracts tracked in one workspace" },
  { value: "11", label: "Renewals highlighted before deadlines" },
  { value: "4", label: "High-priority risk patterns surfaced" },
];

export const trustHighlights = ["Secure by design", "Responsive dashboard", "Modular UI foundation"] as const;

export const landingFeatures: LandingFeature[] = [
  {
    title: "Risk visibility",
    description: "Surface critical clauses and obligations at a glance without overwhelming the user interface.",
  },
  {
    title: "Renewal awareness",
    description: "Provide a clear command center for upcoming dates, reminders, and contract lifecycle milestones.",
  },
  {
    title: "Clause clarity",
    description: "Present structured summaries that support legal review workflows and stakeholder collaboration.",
  },
  {
    title: "Scalable foundation",
    description: "Keep the UI modular so later pages can reuse the same shell, layout, and design language.",
  },
];