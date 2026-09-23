import type { ContractRecord } from "@/types/contracts";

export const contracts: ContractRecord[] = [
  {
    id: "CON-1042",
    name: "Enterprise SaaS Agreement",
    contractType: "Software license",
    company: "Northstar Labs",
    status: "Active",
    riskLevel: "Low",
    expiryDate: "2026-09-14",
    lastUpdated: "2026-08-09",
    startDate: "2024-03-12",
    renewalDate: "2026-08-28",
    noticePeriod: "30 days before renewal",
    paymentTerms: "Annual subscription billed quarterly, net 30.",
    penaltyInfo: "Late payment fee of 1.5% per month after 30 days.",
    clauses: [
      "Data processing obligations and confidentiality protections are clearly defined and aligned with customer policy.",
      "Service level commitments include 99.9% uptime, incident response deadlines, and remediation timelines.",
      "IP ownership remains with the customer for custom deliverables and implementation work created under the agreement.",
      "Termination rights allow for a 30-day cure period before material breach escalation and service suspension.",
      "Audit rights are limited to annual reviews and require reasonable notice periods for compliance enablement.",
      "Usage caps and overage provisions are stated clearly, with forecast-based expansion options included."
    ],
    riskIndicators: [
      "No material legal exposure detected in standard commercial clauses.",
      "Auto-renewal clause requires legal confirmation before the next renewal window.",
      "Data residency requirements should be reviewed for global support footprint.",
      "Support escalation thresholds should be checked against internal service continuity policy.",
      "A renewal notice reminder is required within the next 14 days."
    ],
    summary: "This agreement remains in good standing and is aligned with current commercial terms. The main action is to confirm the renewal notice window before the next cycle.",
    parties: {
      customer: "Northstar Labs",
      vendor: "ContractIQ Services",
      legalOwner: "Ved Patel"
    }
  },
  {
    id: "CON-1098",
    name: "Vendor Services Master Agreement",
    contractType: "Services",
    company: "Apex Operations",
    status: "Review Required",
    riskLevel: "High",
    expiryDate: "2026-11-05",
    lastUpdated: "2026-08-07",
    startDate: "2023-11-20",
    renewalDate: "2026-10-22",
    noticePeriod: "60 days written notice",
    paymentTerms: "Monthly retainer with milestone-based add-ons and net 45 terms.",
    penaltyInfo: "Termination for convenience requires 60 days written notice and payment for completed work.",
    clauses: [
      "Service credit thresholds are not aligned with business continuity requirements and require revision.",
      "Indemnity language is broad and may require legal review before renewal and extension.",
      "Audit rights are limited in a way that could reduce transparency and inhibit control testing.",
      "Confidentiality obligations include carve-outs for regulatory disclosures but lack a broad exception for internal investigations.",
      "Work product ownership is partially unclear for custom templates and internal documentation assets.",
      "Change-order approval windows are narrow and could delay business-critical operations during peak periods."
    ],
    riskIndicators: [
      "Higher exposure around liability caps and indemnity language.",
      "Penalty terms need review before final sign-off on renewal.",
      "Three obligations are currently marked as missing or incomplete.",
      "Service credits may not compensate for downtime caused by a third-party dependency.",
      "The contract lacks a clear escalation path for cross-functional legal and operations review."
    ],
    summary: "The framework agreement has several commercial clauses that require review. The primary risk sits in liability and service credit terms, which should be clarified before renewal.",
    parties: {
      customer: "Apex Operations",
      vendor: "Northbridge Advisory",
      legalOwner: "Daniel Moreau"
    }
  },
  {
    id: "CON-1120",
    name: "Manufacturing Supply Agreement",
    contractType: "Procurement",
    company: "Vertex Manufacturing",
    status: "Active",
    riskLevel: "Moderate",
    expiryDate: "2027-02-18",
    lastUpdated: "2026-08-06",
    startDate: "2025-02-01",
    renewalDate: "2027-01-12",
    noticePeriod: "45 days before renewal",
    paymentTerms: "Quarterly purchase commitments with price adjustment caps.",
    penaltyInfo: "Delivery delays may trigger liquidated damages up to 8% of the affected order value.",
    clauses: [
      "Delivery obligations include milestone-based production schedules and contingency planning for supply disruptions.",
      "Pricing escalation clauses are capped but need annual legal review before the next renewal cycle.",
      "Quality assurance obligations are clear but should be confirmed at supplier level for all critical components.",
      "Force majeure language excludes pandemics and certain operational interruptions that may affect volume assumptions.",
      "Procurement notices and escalation communications require formal documentation before material deviations are accepted.",
      "Termination for convenience is not available for critical inventory categories under the current master contract."
    ],
    riskIndicators: [
      "Supplier performance risk is moderate due to seasonal demand fluctuations.",
      "There is a review note on delivery schedule flexibility.",
      "Renewal is not yet due, but the contract should be tracked quarterly.",
      "A seasonal dependency may increase the risk of short-notice supply disruption.",
      "The force majeure clause should be validated against current production risk assumptions."
    ],
    summary: "The agreement remains operationally healthy and commercially manageable. Performance tracking should continue, with a planned legal review ahead of the renewal cycle.",
    parties: {
      customer: "Vertex Manufacturing",
      vendor: "Helio Supply Co.",
      legalOwner: "Sofia Gupta"
    }
  },
  {
    id: "CON-1184",
    name: "Confidentiality Agreement",
    contractType: "NDA",
    company: "BlueRiver Capital",
    status: "Draft",
    riskLevel: "Low",
    expiryDate: "2026-10-01",
    lastUpdated: "2026-08-02",
    startDate: "2026-07-15",
    renewalDate: "2026-09-15",
    noticePeriod: "15 days before expiry",
    paymentTerms: "No fees; mutual confidentiality obligations.",
    penaltyInfo: "No penalty clause; standard injunctive remedies apply for misuse of confidential information.",
    clauses: [
      "Mutual confidentiality and treatment of non-public information are defined across the full information lifecycle.",
      "Permitted disclosures are limited to legal and regulatory counsel, with explicit notice requirements for material events.",
      "Return or destruction requirements are included for all materials, including notes and digital copies.",
      "The agreement includes a clear exception for disclosures required by law or regulatory order.",
      "Ownership of background IP remains unaffected, with confidentiality protections applying to all exchange materials.",
      "The term and survival period align with the commercial intent but should be reconfirmed before signing."
    ],
    riskIndicators: [
      "This draft is low risk but still needs final approval from legal.",
      "Review the term length against the current data retention policy.",
      "One clause is waiting for final sign-off by the commercial owner.",
      "A limited exception may require additional review for board-level data disclosures.",
      "The final signature packet should be reviewed before execution."
    ],
    summary: "The agreement is in draft form and largely compliant. It requires a closing review before execution to confirm the term and handling obligations are aligned with policy.",
    parties: {
      customer: "BlueRiver Capital",
      vendor: "ContractIQ Services",
      legalOwner: "Alicia Finn"
    }
  }
];

export const getContractById = (id: string) => contracts.find((contract) => contract.id === id) ?? null;
