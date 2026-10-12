import type { ContractRecord } from "@/types/contracts";

export const contracts: ContractRecord[] = [
  {
    id: "DEMO-101",
    name: "Enterprise SaaS License & Support",
    contractType: "Software License",
    company: "Northstar Labs Inc.",
    status: "Active",
    riskLevel: "Low",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2024-01-15",
    expiryDate: "2028-12-31",
    renewalDate: "2028-11-30",
    lastUpdated: "2026-09-10",
    noticePeriod: "30 days prior to renewal",
    paymentTerms: "Annual upfront payment of $120,000. All invoices paid.",
    penaltyInfo: "Standard 1.0% late payment fee per month if unpaid past 30 days.",
    summary: "Comprehensive multi-year enterprise SaaS agreement. Payment is fully completed, expiration is far in the future (2028), and legal risk is low.",
    clauses: [
      "SLA guarantee of 99.9% uptime with service credit compensation.",
      "Customer retains full ownership of all uploaded data and derivative analytics.",
      "SOC-2 Type II and ISO 27001 security compliance certified by third party audit.",
      "Mutual limitation of liability capped at 12 months trailing fees."
    ],
    riskIndicators: [
      "Standard commercial risk profile with clear liability caps.",
      "All payment obligations are up to date and verified."
    ],
    parties: {
      customer: "ContractIQ Enterprise",
      vendor: "Northstar Labs Inc.",
      legalOwner: "Ved Patel"
    },
    fileName: "DEMO_Northstar_SaaS_2024.pdf",
    fileSize: "1.4 MB"
  },
  {
    id: "DEMO-102",
    name: "Cloud Infrastructure Master Agreement",
    contractType: "Infrastructure & Services",
    company: "Apex Operations Ltd.",
    status: "Review Required",
    riskLevel: "High",
    paymentStatus: "Payment Due Soon",
    isDemo: true,
    startDate: "2024-10-01",
    expiryDate: "2026-10-15",
    renewalDate: "2026-09-30",
    lastUpdated: "2026-09-20",
    noticePeriod: "15 days before renewal cutoff",
    paymentTerms: "Quarterly billing net 30. Q3 Invoice #8841 ($45,000) due on 2026-09-28.",
    penaltyInfo: "Uncapped liability for service outages; 2% monthly late surcharge.",
    summary: "Critical cloud infrastructure contract with payment due within 4 days and renewal notice window open now. Contains uncapped liability exceptions requiring urgent review.",
    clauses: [
      "Vendor excludes indirect damages except in cases of gross negligence or data breach.",
      "Uncapped indemnification for third-party IP infringement claims.",
      "Automatic annual price escalator of 8% unless renegotiated 30 days prior."
    ],
    riskIndicators: [
      "HIGH RISK: Uncapped liability for vendor operational failures.",
      "PAYMENT DUE SOON: Invoice #8841 ($45,000) due in 4 days.",
      "RENEWAL APPROACHING: Renewal notice window closes in 6 days (2026-09-30).",
      "EXPIRY APPROACHING: Contract expires on 2026-10-15."
    ],
    parties: {
      customer: "ContractIQ Operations",
      vendor: "Apex Operations Ltd.",
      legalOwner: "Sarah Jenkins"
    },
    fileName: "DEMO_Apex_Cloud_Master.pdf",
    fileSize: "2.8 MB"
  },
  {
    id: "DEMO-103",
    name: "Global Freight & Logistics Services",
    contractType: "Procurement & Logistics",
    company: "Vertex Supply Chain Solutions",
    status: "Review Required",
    riskLevel: "Moderate",
    paymentStatus: "Payment Overdue",
    isDemo: true,
    startDate: "2023-06-01",
    expiryDate: "2027-06-30",
    renewalDate: "2027-05-15",
    lastUpdated: "2026-09-18",
    noticePeriod: "60 days prior to expiration",
    paymentTerms: "Monthly invoices net 15. Invoice #INV-2026-07 ($28,400) was due 2026-08-31.",
    penaltyInfo: "1.5% interest accrued per 15 overdue days; potential cargo hold after 30 days past due.",
    summary: "Ongoing logistics vendor contract. Expiry is far away, but payment is 24 days overdue, posing operational supply chain risk.",
    clauses: [
      "Logistics service level target of 95% on-time delivery across North American corridors.",
      "Carrier liability capped under Carmack Amendment standards unless declared value option is selected.",
      "Payment delay beyond 30 days grants carrier right of lien on in-transit goods."
    ],
    riskIndicators: [
      "PAYMENT OVERDUE: Invoice #INV-2026-07 ($28,400) is 24 days past due.",
      "Right of lien risk on active shipments if balance is not settled immediately.",
      "Moderate operational risk; contract expiry is far away (2027-06-30)."
    ],
    parties: {
      customer: "ContractIQ Logistics",
      vendor: "Vertex Supply Chain Solutions",
      legalOwner: "Michael Chang"
    },
    fileName: "DEMO_Vertex_Logistics_Master.pdf",
    fileSize: "3.1 MB"
  },
  {
    id: "DEMO-104",
    name: "Legacy Marketing & Media Services",
    contractType: "Professional Services",
    company: "BlueRiver Brand Agency",
    status: "Expired",
    riskLevel: "High",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2024-01-01",
    expiryDate: "2025-12-31",
    renewalDate: "2025-11-30",
    lastUpdated: "2026-01-05",
    noticePeriod: "30 days prior to end of term",
    paymentTerms: "All final invoices settled and paid in full.",
    penaltyInfo: "Post-termination IP transition penalty if final deliverables not signed off within 60 days.",
    summary: "Historical marketing agreement that expired on Dec 31, 2025. Although payments are completed, final IP transfer sign-off remains outstanding.",
    clauses: [
      "All custom marketing assets become customer property upon full payment.",
      "Confidentiality obligations survive termination for a period of 3 years.",
      "Non-solicitation of agency personnel for 12 months post-expiration."
    ],
    riskIndicators: [
      "ALREADY EXPIRED: Contract term ended on 2025-12-31.",
      "HIGH RISK: Pending IP assignment sign-off document for 2025 campaign assets.",
      "All financial obligations are fully paid."
    ],
    parties: {
      customer: "ContractIQ Marketing",
      vendor: "BlueRiver Brand Agency",
      legalOwner: "Elena Rostova"
    },
    fileName: "DEMO_BlueRiver_Media_2024.pdf",
    fileSize: "1.9 MB"
  },
  {
    id: "DEMO-105",
    name: "Corporate Headquarters Lease Agreement",
    contractType: "Real Estate Lease",
    company: "Horizon Commercial Properties",
    status: "Active",
    riskLevel: "Moderate",
    paymentStatus: "Payment Due Soon",
    isDemo: true,
    startDate: "2021-11-01",
    expiryDate: "2026-11-30",
    renewalDate: "2026-10-05",
    lastUpdated: "2026-09-22",
    noticePeriod: "60 days formal written notice for 3-year extension option",
    paymentTerms: "Monthly base rent $52,000 due 1st of each month. October rent due in 7 days.",
    penaltyInfo: "Late rent incurs $500 initial penalty plus 5% interest per annum.",
    summary: "Headquarters commercial lease with lease expiry approaching in Nov 2026 and renewal option notice window closing on Oct 5, 2026 (in 11 days).",
    clauses: [
      "Tenant option to renew for an additional 3-year term at fair market rent.",
      "Landlord responsible for structural maintenance and HVAC replacement.",
      "Tenant sublease permitted subject to landlord's prior written consent not to be unreasonably withheld."
    ],
    riskIndicators: [
      "RENEWAL APPROACHING: Option notice deadline is 2026-10-05 (11 days remaining).",
      "EXPIRY APPROACHING: Lease expires on 2026-11-30.",
      "PAYMENT DUE SOON: October lease payment ($52,000) due on Oct 1."
    ],
    parties: {
      customer: "ContractIQ Corp",
      vendor: "Horizon Commercial Properties",
      legalOwner: "David Miller"
    },
    fileName: "DEMO_Horizon_HQ_Lease.pdf",
    fileSize: "4.5 MB"
  },
  {
    id: "DEMO-106",
    name: "AI Algorithm Development & Consulting",
    contractType: "Consulting & IP",
    company: "Quantum AI Labs",
    status: "Review Required",
    riskLevel: "Critical",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2025-03-01",
    expiryDate: "2028-05-15",
    renewalDate: "2028-04-15",
    lastUpdated: "2026-09-14",
    noticePeriod: "30 days prior to contract milestone",
    paymentTerms: "Milestone-based payments. Phase 1 & 2 ($180,000 total) completed and paid.",
    penaltyInfo: "Dispute resolution requires mandatory arbitration in London under LCIA rules.",
    summary: "Specialized AI consulting contract. Payment completed & expiry far away, but contains CRITICAL risks: missing audit rights, broad non-compete, and foreign arbitration clause.",
    clauses: [
      "Consultant retains rights to core underlying machine learning model architectures.",
      "Customer receives exclusive license only for domain-specific fine-tuned weights.",
      "Broad non-compete clause restricting customer from hiring in computer vision space for 24 months."
    ],
    riskIndicators: [
      "CRITICAL RISK: Contract restricts customer hiring across computer vision domain.",
      "CRITICAL RISK: Foreign arbitration venue (London LCIA) increases litigation cost.",
      "No security audit rights clause present for AI model weights training pipeline.",
      "Expiry far away (2028-05-15); payments fully paid."
    ],
    parties: {
      customer: "ContractIQ AI Team",
      vendor: "Quantum AI Labs",
      legalOwner: "Ved Patel"
    },
    fileName: "DEMO_Quantum_AI_Agreement.pdf",
    fileSize: "2.2 MB"
  }
];

export const getContractById = (id: string) => contracts.find((contract) => contract.id === id) ?? null;
