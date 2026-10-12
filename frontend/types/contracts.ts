export type ContractStatus = "Active" | "Review Required" | "Draft" | "Expired";
export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type PaymentStatus = "Paid" | "Payment Due Soon" | "Payment Overdue" | "Not Applicable" | "Not Specified";

export type ContractRecord = {
  id: string;
  name: string;
  contractType: string;
  company: string;
  status: ContractStatus;
  riskLevel: RiskLevel;
  paymentStatus?: PaymentStatus;
  isDemo?: boolean;
  expiryDate: string;
  lastUpdated: string;
  startDate: string;
  renewalDate: string;
  noticePeriod: string;
  paymentTerms: string;
  penaltyInfo: string;
  clauses: string[];
  riskIndicators: string[];
  summary: string;
  parties: {
    customer: string;
    vendor: string;
    legalOwner: string;
  };
  fileName?: string;
  fileSize?: string;
};
