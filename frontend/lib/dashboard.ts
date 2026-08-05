import type { DashboardMetric, DeadlineItem, RecentContract } from "@/types/dashboard";

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Total Contracts", value: "128", change: "+12 this month", tone: "positive" },
  { label: "Active Contracts", value: "94", change: "73% of portfolio", tone: "neutral" },
  { label: "Upcoming Renewals", value: "18", change: "6 due in 30 days", tone: "warning" },
  { label: "High Risk Contracts", value: "7", change: "3 need urgent review", tone: "warning" },
];

export const recentContracts: RecentContract[] = [
  {
    name: "Enterprise SaaS Agreement",
    counterparty: "Northstar Labs",
    type: "Software License",
    status: "Active",
    renewal: "14 Sep 2026",
  },
  {
    name: "Vendor Services Contract",
    counterparty: "Apex Operations",
    type: "Services",
    status: "Review Required",
    renewal: "02 Oct 2026",
  },
  {
    name: "Master Supply Agreement",
    counterparty: "Vertex Manufacturing",
    type: "Procurement",
    status: "Active",
    renewal: "19 Aug 2026",
  },
  {
    name: "Confidentiality Agreement",
    counterparty: "BlueRiver Capital",
    type: "NDA",
    status: "Signed",
    renewal: "No renewal",
  },
];

export const upcomingDeadlines: DeadlineItem[] = [
  {
    title: "Renewal notice for Northstar Labs",
    date: "12 Aug 2026",
    detail: "Send reminder before auto-renewal window closes.",
  },
  {
    title: "Penalty review for Apex Operations",
    date: "16 Aug 2026",
    detail: "Validate indemnity and late-fee clauses with legal ops.",
  },
  {
    title: "Obligation check for Vertex Manufacturing",
    date: "21 Aug 2026",
    detail: "Confirm delivery timelines and milestone commitments.",
  },
];
