import type { ContractRecord } from "@/types/contracts";

export const contracts: ContractRecord[] = [
  {
    id: "DEMO-NDA-01",
    name: "Mutual Non-Disclosure Agreement",
    contractType: "Non-Disclosure Agreement",
    company: "Aegis BioTech Ltd.",
    status: "Active",
    riskLevel: "Low",
    paymentStatus: "Not Applicable",
    isDemo: true,
    startDate: "2025-06-01",
    expiryDate: "2027-06-01",
    renewalDate: "Not applicable",
    lastUpdated: "2026-09-15",
    noticePeriod: "30 days written notice for convenience",
    paymentTerms: "Not applicable ($0 / Mutual non-financial consideration)",
    penaltyInfo: "Injunctive relief and actual damages for unauthorized disclosure.",
    summary: "A bilateral non-disclosure agreement protecting proprietary research, chemical assays, and trade secrets between ContractIQ Enterprises and Aegis BioTech Ltd. It establishes a standard two-year confidentiality term with a three-year survival clause on trade secrets.",
    clauses: [
      "Confidential Information includes all non-public technical, commercial, scientific, and business data disclosed in writing or orally with subsequent written confirmation within fifteen (15) days.",
      "Receiving Party shall protect Disclosing Party's confidential information using at least the same degree of care used for its own confidential data, but in no event less than reasonable care.",
      "Exclusions from confidentiality apply to information publicly known through no breach, already in possession prior to disclosure, or independently developed without reference to confidential materials.",
      "Obligations of confidentiality shall survive for thirty-six (36) months following the expiration or termination of this Agreement."
    ],
    riskIndicators: [
      "Standard low-risk bilateral NDA with customary trade secret exclusions and survival terms.",
      "Fixed two-year term with no automatic renewal commitment; contract naturally sunsets on June 1, 2027."
    ],
    parties: {
      customer: "ContractIQ Enterprises",
      vendor: "Aegis BioTech Ltd.",
      legalOwner: "Elena Rostova"
    },
    fileName: "DEMO-NDA-01.pdf",
    fileSize: "1.1 MB"
  },
  {
    id: "DEMO-EMP-02",
    name: "Executive Employment Agreement",
    contractType: "Employment Agreement",
    company: "Vanguard Media Group",
    status: "Active",
    riskLevel: "Moderate",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2024-05-15",
    expiryDate: "2027-05-14",
    renewalDate: "2027-05-15",
    lastUpdated: "2026-09-20",
    noticePeriod: "60 days advance written notice prior to term expiration",
    paymentTerms: "$240,000 base annual salary payable semi-monthly, plus up to 25% annual performance bonus.",
    penaltyInfo: "Forfeiture of unvested equity options upon termination for cause.",
    summary: "Executive employment contract appointing Marcus Vance as Vice President of Engineering at Vanguard Media Group. Outlines executive compensation, IP assignment, non-solicitation, and a mutual 1-year extension option requiring 60 days advance written notice.",
    clauses: [
      "Executive shall receive an annual base salary of $240,000, payable in semi-monthly installments, subject to standard statutory withholdings and annual merit review.",
      "Executive agrees to assign and hereby does assign all right, title, and interest in all inventions, software, and works created during the period of employment.",
      "During employment and for twelve (12) months following termination, Executive shall not solicit company employees, contractors, or active commercial accounts.",
      "The initial three-year term may be extended for an additional twelve (12) months upon mutual written agreement delivered at least sixty (60) days prior to May 14, 2027."
    ],
    riskIndicators: [
      "Non-compete covenant is geographically restricted to North America; enforceable under governing law but warrants periodic compliance review.",
      "Severance commitment requires six (6) months base salary payout if terminated without cause."
    ],
    parties: {
      customer: "Vanguard Media Group",
      vendor: "Marcus Vance (VP of Engineering)",
      legalOwner: "Sofia Gupta"
    },
    fileName: "DEMO-EMP-02.pdf",
    fileSize: "1.4 MB"
  },
  {
    id: "DEMO-SVC-03",
    name: "IT Managed Infrastructure Services Agreement",
    contractType: "Service Agreement",
    company: "CloudScale Systems Inc.",
    status: "Active",
    riskLevel: "Moderate",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2025-01-01",
    expiryDate: "2026-12-31",
    renewalDate: "2027-01-01",
    lastUpdated: "2026-09-22",
    noticePeriod: "45 days written notice before anniversary (Deadline: 2026-11-16)",
    paymentTerms: "$8,500 monthly recurring service fee ($102,000/yr), Net 30 terms upon monthly invoice.",
    penaltyInfo: "Service credits up to 15% of monthly fees for uptime falling below 99.95%.",
    summary: "Managed cloud infrastructure and tier-1 DevOps support agreement between ContractIQ Operations and CloudScale Systems Inc. Features automated annual renewal and SLA uptime guarantees backed by service credits.",
    clauses: [
      "CloudScale guarantees 99.95% monthly infrastructure availability, excluding scheduled maintenance windows notified at least seventy-two (72) hours in advance.",
      "Agreement automatically renews for successive twelve (12) month periods unless either party delivers written notice of non-renewal at least forty-five (45) days prior to the expiration of the current term.",
      "Aggregate liability for each party under this Agreement is capped at the total amount paid by Customer in the twelve (12) months preceding the claim.",
      "Customer data remains customer's exclusive property and must be maintained strictly within specified AWS US-East regions."
    ],
    riskIndicators: [
      "Automatic renewal clause requires written notice by November 16, 2026 to prevent rollover into 2027.",
      "SLA remedies are limited exclusively to service credits with a maximum cap of 15% per billing month."
    ],
    parties: {
      customer: "ContractIQ Operations",
      vendor: "CloudScale Systems Inc.",
      legalOwner: "Daniel Moreau"
    },
    fileName: "DEMO-SVC-03.pdf",
    fileSize: "2.1 MB"
  },
  {
    id: "DEMO-EQP-04",
    name: "Equipment Lease and Service Agreement",
    contractType: "Equipment Lease",
    company: "EquipmentCorp",
    status: "Active",
    riskLevel: "Low",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2026-03-01",
    expiryDate: "2027-02-28",
    renewalDate: "2027-03-01",
    lastUpdated: "2026-09-25",
    noticePeriod: "90 days prior to annual renewal (Deadline: 2026-12-01)",
    paymentTerms: "Net 30 terms ($12,500 monthly rent; $150,000 annualized).",
    penaltyInfo: "Late payment interest of 1.5% per month; right of repossession after 60 days default.",
    summary: "Industrial machinery lease and maintenance agreement between EquipmentCorp (lessor) and FactoryLabs Industrial (lessee). Contract establishes $12,500 monthly rent, mandatory $2M liability insurance, and an annual renewal cycle with a 90-day non-renewal notice requirement.",
    clauses: [
      "Monthly lease payment of $12,500 shall be due on Net 30 terms following invoice issuance on the first day of each calendar month.",
      "Termination or non-renewal requires ninety (90) days advance written notice prior to the annual renewal date of March 1.",
      "Lessee shall maintain comprehensive general liability insurance with coverage limits of not less than $2,000,000 per occurrence throughout the lease term.",
      "EquipmentCorp shall perform all scheduled bi-annual mechanical inspections and major overhauls at its own expense."
    ],
    riskIndicators: [
      "Strict 90-day advance notice requirement prior to annual renewal (deadline December 1, 2026) to avoid automatic 1-year renewal.",
      "Mandatory requirement for Lessee to keep $2,000,000 liability insurance policy in active standing."
    ],
    parties: {
      customer: "FactoryLabs Industrial",
      vendor: "EquipmentCorp",
      legalOwner: "Michael Chang"
    },
    fileName: "DEMO-EQP-04.pdf",
    fileSize: "1.5 MB"
  },
  {
    id: "DEMO-CNS-05",
    name: "Software Architecture & Consulting Services Agreement",
    contractType: "Software Consulting Agreement",
    company: "DevAgency Technologies",
    status: "Review Required",
    riskLevel: "High",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2026-01-15",
    expiryDate: "2026-11-15",
    renewalDate: "Not applicable",
    lastUpdated: "2026-09-18",
    noticePeriod: "14 days written notice for convenience",
    paymentTerms: "$18,000 monthly retainer across 10 months ($180,000 total), Net 15 terms.",
    penaltyInfo: "Right to withhold deliverables and suspend code repository access if payment delayed past 30 days.",
    summary: "Specialized consulting contract for platform architecture and microservices redesign. Ten-month fixed-term engagement concluding in November 2026 with no auto-renewal. Flags high risk due to conditional IP assignment timing and short convenience termination notice.",
    clauses: [
      "Consultant shall provide high-level cloud architecture, distributed systems consulting, and automated deployment pipelines.",
      "All rights, title, and interest in deliverables transfer to Client only upon receipt of payment in full for the corresponding billing phase.",
      "Either party may terminate this Agreement without cause upon fourteen (14) days prior written notice to the other party.",
      "Consultant warrants all deliverables against material defects and security vulnerabilities for ninety (90) days following production deployment."
    ],
    riskIndicators: [
      "HIGH RISK: Intellectual property rights transfer is conditioned upon payment in full rather than work creation.",
      "HIGH RISK: 14-day termination for convenience creates operational vulnerability if core systems architect exits abruptly.",
      "Uncapped indemnity for third-party open-source license infringements requires clarification."
    ],
    parties: {
      customer: "ContractIQ Platform",
      vendor: "DevAgency Technologies",
      legalOwner: "Ved Patel"
    },
    fileName: "DEMO-CNS-05.pdf",
    fileSize: "1.8 MB"
  },
  {
    id: "DEMO-VND-06",
    name: "Global Cloud Hardware & Vendor Supply Agreement",
    contractType: "Vendor Agreement",
    company: "Apex Operations Ltd.",
    status: "Review Required",
    riskLevel: "High",
    paymentStatus: "Payment Due Soon",
    isDemo: true,
    startDate: "2024-10-01",
    expiryDate: "2026-10-31",
    renewalDate: "2026-11-01",
    lastUpdated: "2026-10-02",
    noticePeriod: "30 days written notice before term expiration (Deadline: 2026-10-01 — Notice Passed)",
    paymentTerms: "Quarterly billing ($45,000 per quarter) Net 30. Q4 Invoice #8841 pending.",
    penaltyInfo: "Uncapped liability for service interruptions; 2% monthly late payment surcharge.",
    summary: "Critical hardware co-location and vendor procurement agreement. Contract expires on October 31, 2026, and the 30-day non-renewal cutoff (October 1, 2026) has already passed, triggering an automatic 1-year renewal with an 8% price increase unless renegotiated immediately.",
    clauses: [
      "Apex Operations supplies dedicated enterprise server chassis and high-bandwidth interconnects in Tier-3 datacenter facilities.",
      "Agreement automatically renews for successive 12-month terms unless written notice of non-renewal is provided at least thirty (30) days prior to term expiration.",
      "Annual fee shall increase by eight percent (8%) upon each renewal period without requiring separate written amendment.",
      "Vendor excludes liability for consequential damages except for gross negligence, willful misconduct, or unauthorized data exposure."
    ],
    riskIndicators: [
      "HIGH RISK: Renewal notice window passed (October 1, 2026); contract is rolling over into 2027 with automatic 8% price escalator.",
      "PAYMENT DUE SOON: Q4 Invoice #8841 ($45,000) is due within the current billing cycle.",
      "Contains uncapped liability exceptions for operational network disruptions."
    ],
    parties: {
      customer: "ContractIQ Infrastructure",
      vendor: "Apex Operations Ltd.",
      legalOwner: "Sarah Jenkins"
    },
    fileName: "DEMO-VND-06.pdf",
    fileSize: "2.8 MB"
  },
  {
    id: "DEMO-MSA-07",
    name: "Enterprise Master Services Agreement",
    contractType: "Master Services Agreement",
    company: "ProviderTech Global Ltd.",
    status: "Active",
    riskLevel: "Moderate",
    paymentStatus: "Paid",
    isDemo: true,
    startDate: "2024-04-01",
    expiryDate: "2027-03-31",
    renewalDate: "2027-04-01",
    lastUpdated: "2026-09-24",
    noticePeriod: "60 days advance written notice prior to renewal date (Deadline: 2027-01-30)",
    paymentTerms: "Statements of Work (SOW) milestone billing, Net 45 payment terms.",
    penaltyInfo: "Liquidated damages equal to 10% of SOW fee for milestone delays exceeding 30 calendar days.",
    summary: "Enterprise framework agreement governing all professional service engagements, Statements of Work, and engineering contracting. Multi-year term expiring in March 2027 with auto-renewal and a 60-day advance notice requirement.",
    clauses: [
      "This Master Agreement establishes the standard contractual framework governing all subsequent Statements of Work (SOWs) executed by the parties.",
      "Agreement shall renew automatically for successive one-year terms unless either party gives written notice of termination at least sixty (60) days prior to the end of the term.",
      "Each party agrees to indemnify, defend, and hold harmless the other from third-party claims arising from gross negligence or willful misconduct.",
      "All intellectual property developed pursuant to an SOW shall be owned exclusively by Customer as 'work made for hire.'"
    ],
    riskIndicators: [
      "Liquidated damages clause triggers financial penalties if project milestone delivery is delayed by vendor.",
      "Annual renewal requires 60-day advance review window before January 30, 2027."
    ],
    parties: {
      customer: "ContractIQ Corp",
      vendor: "ProviderTech Global Ltd.",
      legalOwner: "Daniel Moreau"
    },
    fileName: "DEMO-MSA-07.pdf",
    fileSize: "2.4 MB"
  },
  {
    id: "DEMO-RNT-08",
    name: "Commercial Office Lease Agreement",
    contractType: "Commercial Rental Agreement",
    company: "Metro Real Estate Holdings",
    status: "Review Required",
    riskLevel: "High",
    paymentStatus: "Payment Due Soon",
    isDemo: true,
    startDate: "2023-11-01",
    expiryDate: "2026-10-31",
    renewalDate: "2026-11-01",
    lastUpdated: "2026-10-01",
    noticePeriod: "90 days formal written option notice (Notice deadline was 2026-08-02 — Expired)",
    paymentTerms: "$52,000 monthly base rent plus common area maintenance (CAM), Net 5.",
    penaltyInfo: "Holdover penalty: 150% of monthly base rent if premises not vacated by October 31, 2026.",
    summary: "Headquarters office lease for 12,000 sq ft commercial space. Three-year term terminates on October 31, 2026 (in 19 days). The 90-day option notice deadline passed in August 2026, exposing tenant to 150% holdover rent penalties unless an immediate lease extension amendment is executed.",
    clauses: [
      "Tenant leases 12,000 rentable square feet comprising Suite 400 at Metro Tower for commercial corporate office use.",
      "Base monthly rent of $52,000 shall be paid on or before the first day of each calendar month, subject to standard CAM reconciliation.",
      "Tenant had the option to extend the lease term for three (3) years by providing written notice to Landlord at least ninety (90) days prior to expiration.",
      "Failure to vacate upon expiration of the term shall constitute a tenancy at sufferance with rent payable at 150% of the last applicable monthly base rent."
    ],
    riskIndicators: [
      "HIGH RISK: Lease expires in 19 days (October 31, 2026). Renewal option deadline (August 2, 2026) has lapsed.",
      "CRITICAL EXPOSURE: Holdover penalty rate of 150% ($78,000/mo) applies immediately starting November 1, 2026.",
      "October rent ($52,000) and pending CAM adjustments require immediate administrative settlement."
    ],
    parties: {
      customer: "ContractIQ Tech Hub",
      vendor: "Metro Real Estate Holdings LLC",
      legalOwner: "David Miller"
    },
    fileName: "DEMO-RNT-08.pdf",
    fileSize: "3.2 MB"
  }
];

export const getContractById = (id: string) => contracts.find((contract) => contract.id === id) ?? null;
