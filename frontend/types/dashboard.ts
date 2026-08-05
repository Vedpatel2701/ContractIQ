export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "positive" | "warning" | "neutral";
};

export type RecentContract = {
  name: string;
  counterparty: string;
  type: string;
  status: string;
  renewal: string;
};

export type DeadlineItem = {
  title: string;
  date: string;
  detail: string;
};
