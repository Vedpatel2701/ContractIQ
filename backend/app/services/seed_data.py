"""
ContractIQ Realistic Seed Data Generator & Manager
Provides canonical demo contracts with coherent dates, renewal terms, and accurate legal metadata.
Maintains idempotency: repeated execution updates existing records without creating duplicates.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import RiskIndicator
from app.models.user import User, UserRole
from app.services.chunker import chunk_contract_text
from app.services.vector_store import VectorStore
from app.services.notifications import generate_deadline_notifications

CANONICAL_DEMO_CONTRACTS: List[Dict[str, Any]] = [
    {
        "id": "DEMO-NDA-01",
        "name": "Mutual Non-Disclosure Agreement",
        "contract_type": "Non-Disclosure Agreement",
        "company": "Aegis BioTech Ltd.",
        "status": "Active",
        "risk_level": "Low",
        "payment_status": "Not Applicable",
        "is_demo": True,
        "start_date": "2025-06-01",
        "expiry_date": "2027-06-01",
        "renewal_date": "Not applicable",
        "notice_period": "30 days written notice for convenience",
        "payment_terms": "Not applicable ($0 / Mutual non-financial consideration)",
        "penalty_info": "Injunctive relief and actual damages for unauthorized disclosure.",
        "summary": "A bilateral non-disclosure agreement protecting proprietary research, chemical assays, and trade secrets between ContractIQ Enterprises and Aegis BioTech Ltd. It establishes a standard two-year confidentiality term with a three-year survival clause on trade secrets.",
        "customer": "ContractIQ Enterprises",
        "vendor": "Aegis BioTech Ltd.",
        "legal_owner": "Elena Rostova",
        "clauses": [
            "Confidential Information includes all non-public technical, commercial, scientific, and business data disclosed in writing or orally with subsequent written confirmation within fifteen (15) days.",
            "Receiving Party shall protect Disclosing Party's confidential information using at least the same degree of care used for its own confidential data, but in no event less than reasonable care.",
            "Exclusions from confidentiality apply to information publicly known through no breach, already in possession prior to disclosure, or independently developed without reference to confidential materials.",
            "Obligations of confidentiality shall survive for thirty-six (36) months following the expiration or termination of this Agreement."
        ],
        "risks": [
            "Standard low-risk bilateral NDA with customary trade secret exclusions and survival terms.",
            "Fixed two-year term with no automatic renewal commitment; contract naturally sunsets on June 1, 2027."
        ],
        "extracted_text": """--- Page 1 ---
MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made effective as of June 1, 2025, by and between ContractIQ Enterprises ("ContractIQ") and Aegis BioTech Ltd. ("Aegis BioTech").

1. PURPOSE
The parties wish to explore prospective collaborative research and commercial initiatives relating to biotechnology data analytics.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" refers to all non-public information disclosed by either party to the other, whether orally or in writing, designated as confidential or that reasonably should be understood to be confidential given the nature of the information.

--- Page 2 ---
3. NON-DISCLOSURE OBLIGATIONS
Each party agrees to use the Confidential Information solely for the Purpose and to protect it using the same degree of care as it uses for its own confidential data of like nature, but no less than reasonable care.

4. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known without breach of this Agreement; (b) was already known to Receiving Party without confidentiality restrictions; or (c) is independently developed without reference to Disclosing Party's information.

5. TERM AND SURVIVAL
This Agreement shall govern disclosures made for a period of two (2) years ending June 1, 2027. Confidentiality obligations shall survive termination for thirty-six (36) months thereafter. This Agreement does not renew automatically."""
    },
    {
        "id": "DEMO-EMP-02",
        "name": "Executive Employment Agreement",
        "contract_type": "Employment Agreement",
        "company": "Vanguard Media Group",
        "status": "Active",
        "risk_level": "Moderate",
        "payment_status": "Paid",
        "is_demo": True,
        "start_date": "2024-05-15",
        "expiry_date": "2027-05-14",
        "renewal_date": "2027-05-15",
        "notice_period": "60 days advance written notice prior to term expiration",
        "payment_terms": "$240,000 base annual salary payable semi-monthly, plus up to 25% annual performance bonus.",
        "penalty_info": "Forfeiture of unvested equity options upon termination for cause.",
        "summary": "Executive employment contract appointing Marcus Vance as Vice President of Engineering at Vanguard Media Group. Outlines executive compensation, IP assignment, non-solicitation, and a mutual 1-year extension option requiring 60 days advance written notice.",
        "customer": "Vanguard Media Group",
        "vendor": "Marcus Vance (VP of Engineering)",
        "legal_owner": "Sofia Gupta",
        "clauses": [
            "Executive shall receive an annual base salary of $240,000, payable in semi-monthly installments, subject to standard statutory withholdings and annual merit review.",
            "Executive agrees to assign and hereby does assign all right, title, and interest in all inventions, software, and works created during the period of employment.",
            "During employment and for twelve (12) months following termination, Executive shall not solicit company employees, contractors, or active commercial accounts.",
            "The initial three-year term may be extended for an additional twelve (12) months upon mutual written agreement delivered at least sixty (60) days prior to May 14, 2027."
        ],
        "risks": [
            "Non-compete covenant is geographically restricted to North America; enforceable under governing law but warrants periodic compliance review.",
            "Severance commitment requires six (6) months base salary payout if terminated without cause."
        ],
        "extracted_text": """--- Page 1 ---
EXECUTIVE EMPLOYMENT AGREEMENT

This Executive Employment Agreement is entered into on May 15, 2024, by Vanguard Media Group ("Employer") and Marcus Vance ("Executive").

1. POSITION AND DUTIES
Executive shall serve as Vice President of Engineering, reporting to the Chief Technology Officer, and shall oversee platform architecture and development operations.

2. COMPENSATION
(a) Base Salary: Employer shall pay Executive an annual base salary of $240,000 in accordance with standard semi-monthly payroll schedules.
(b) Incentive Bonus: Executive is eligible for an annual performance bonus of up to 25% of base salary based upon milestones agreed annually.

--- Page 2 ---
3. TERM AND EXTENSION
The initial term shall be three (3) years, expiring on May 14, 2027. The term may be extended for successive one-year periods upon mutual written consent provided at least sixty (60) days prior to expiration.

4. INTELLECTUAL PROPERTY & RESTRICTIVE COVENANTS
Executive hereby assigns all right, title, and interest in any intellectual property created during employment. Executive covenants not to solicit employees or clients for twelve (12) months post-employment."""
    },
    {
        "id": "DEMO-SVC-03",
        "name": "IT Managed Infrastructure Services Agreement",
        "contract_type": "Service Agreement",
        "company": "CloudScale Systems Inc.",
        "status": "Active",
        "risk_level": "Moderate",
        "payment_status": "Paid",
        "is_demo": True,
        "start_date": "2025-01-01",
        "expiry_date": "2026-12-31",
        "renewal_date": "2027-01-01",
        "notice_period": "45 days written notice before anniversary (Deadline: 2026-11-16)",
        "payment_terms": "$8,500 monthly recurring service fee ($102,000/yr), Net 30 terms upon monthly invoice.",
        "penalty_info": "Service credits up to 15% of monthly fees for uptime falling below 99.95%.",
        "summary": "Managed cloud infrastructure and tier-1 DevOps support agreement between ContractIQ Operations and CloudScale Systems Inc. Features automated annual renewal and SLA uptime guarantees backed by service credits.",
        "customer": "ContractIQ Operations",
        "vendor": "CloudScale Systems Inc.",
        "legal_owner": "Daniel Moreau",
        "clauses": [
            "CloudScale guarantees 99.95% monthly infrastructure availability, excluding scheduled maintenance windows notified at least seventy-two (72) hours in advance.",
            "Agreement automatically renews for successive twelve (12) month periods unless either party delivers written notice of non-renewal at least forty-five (45) days prior to the expiration of the current term.",
            "Aggregate liability for each party under this Agreement is capped at the total amount paid by Customer in the twelve (12) months preceding the claim.",
            "Customer data remains customer's exclusive property and must be maintained strictly within specified AWS US-East regions."
        ],
        "risks": [
            "Automatic renewal clause requires written notice by November 16, 2026 to prevent rollover into 2027.",
            "SLA remedies are limited exclusively to service credits with a maximum cap of 15% per billing month."
        ],
        "extracted_text": """--- Page 1 ---
IT MANAGED INFRASTRUCTURE SERVICES AGREEMENT

This Agreement is entered into on January 1, 2025, between ContractIQ Operations ("Customer") and CloudScale Systems Inc. ("Provider").

1. SCOPE OF SERVICES
Provider shall furnish cloud management, 24/7 monitoring, security patching, and incident remediation across Customer's cloud clusters.

2. SERVICE LEVEL AGREEMENT (SLA)
Provider commits to 99.95% monthly uptime. If availability drops below this threshold, Customer shall receive a 5% service credit for each 0.1% downtime increment, capped at 15% of the monthly fee.

--- Page 2 ---
3. FEES AND PAYMENT
Customer shall pay a recurring fee of $8,500 per month on Net 30 terms upon receipt of invoice.

4. TERM AND AUTO-RENEWAL
The initial term shall run from January 1, 2025 to December 31, 2026. This Agreement shall automatically renew for consecutive twelve (12) month terms unless either party gives written notice of non-renewal at least forty-five (45) days prior to December 31."""
    },
    {
        "id": "DEMO-EQP-04",
        "name": "Equipment Lease and Service Agreement",
        "contract_type": "Equipment Lease",
        "company": "EquipmentCorp",
        "status": "Active",
        "risk_level": "Low",
        "payment_status": "Paid",
        "is_demo": True,
        "start_date": "2026-03-01",
        "expiry_date": "2027-02-28",
        "renewal_date": "2027-03-01",
        "notice_period": "90 days prior to annual renewal (Deadline: 2026-12-01)",
        "payment_terms": "Net 30 terms ($12,500 monthly rent; $150,000 annualized).",
        "penalty_info": "Late payment interest of 1.5% per month; right of repossession after 60 days default.",
        "summary": "Industrial machinery lease and maintenance agreement between EquipmentCorp (lessor) and FactoryLabs Industrial (lessee). Contract establishes $12,500 monthly rent, mandatory $2M liability insurance, and an annual renewal cycle with a 90-day non-renewal notice requirement.",
        "customer": "FactoryLabs Industrial",
        "vendor": "EquipmentCorp",
        "legal_owner": "Michael Chang",
        "clauses": [
            "Monthly lease payment of $12,500 shall be due on Net 30 terms following invoice issuance on the first day of each calendar month.",
            "Termination or non-renewal requires ninety (90) days advance written notice prior to the annual renewal date of March 1.",
            "Lessee shall maintain comprehensive general liability insurance with coverage limits of not less than $2,000,000 per occurrence throughout the lease term.",
            "EquipmentCorp shall perform all scheduled bi-annual mechanical inspections and major overhauls at its own expense."
        ],
        "risks": [
            "Strict 90-day advance notice requirement prior to annual renewal (deadline December 1, 2026) to avoid automatic 1-year renewal.",
            "Mandatory requirement for Lessee to keep $2,000,000 liability insurance policy in active standing."
        ],
        "extracted_text": """--- Page 1 ---
EQUIPMENT LEASE AND SERVICE AGREEMENT

This Lease Agreement is entered into on March 1, 2026, between EquipmentCorp (Lessor) and FactoryLabs Industrial (Lessee).

1. LEASED EQUIPMENT & RENT
Lessor leases specified manufacturing diagnostic equipment to Lessee. Monthly rent shall be $12,500 due on Net 30 terms following invoice.

2. TERM AND RENEWAL
The initial term begins March 1, 2026 and ends February 28, 2027. The agreement shall renew annually on March 1 unless terminated by written notice at least ninety (90) days prior to the renewal date.

--- Page 2 ---
3. INSURANCE & MAINTENANCE
Lessee shall maintain comprehensive liability insurance of not less than $2,000,000. Lessor shall provide bi-annual preventive maintenance and replacement parts for normal operational wear."""
    },
    {
        "id": "DEMO-CNS-05",
        "name": "Software Architecture & Consulting Services Agreement",
        "contract_type": "Software Consulting Agreement",
        "company": "DevAgency Technologies",
        "status": "Review Required",
        "risk_level": "High",
        "payment_status": "Paid",
        "is_demo": True,
        "start_date": "2026-01-15",
        "expiry_date": "2026-11-15",
        "renewal_date": "Not applicable",
        "notice_period": "14 days written notice for convenience",
        "payment_terms": "$18,000 monthly retainer across 10 months ($180,000 total), Net 15 terms.",
        "penalty_info": "Right to withhold deliverables and suspend code repository access if payment delayed past 30 days.",
        "summary": "Specialized consulting contract for platform architecture and microservices redesign. Ten-month fixed-term engagement concluding in November 2026 with no auto-renewal. Flags high risk due to conditional IP assignment timing and short convenience termination notice.",
        "customer": "ContractIQ Platform",
        "vendor": "DevAgency Technologies",
        "legal_owner": "Ved Patel",
        "clauses": [
            "Consultant shall provide high-level cloud architecture, distributed systems consulting, and automated deployment pipelines.",
            "All rights, title, and interest in deliverables transfer to Client only upon receipt of payment in full for the corresponding billing phase.",
            "Either party may terminate this Agreement without cause upon fourteen (14) days prior written notice to the other party.",
            "Consultant warrants all deliverables against material defects and security vulnerabilities for ninety (90) days following production deployment."
        ],
        "risks": [
            "HIGH RISK: Intellectual property rights transfer is conditioned upon payment in full rather than work creation.",
            "HIGH RISK: 14-day termination for convenience creates operational vulnerability if core systems architect exits abruptly.",
            "Uncapped indemnity for third-party open-source license infringements requires clarification."
        ],
        "extracted_text": """--- Page 1 ---
SOFTWARE ARCHITECTURE & CONSULTING SERVICES AGREEMENT

This Agreement is made on January 15, 2026, by and between ContractIQ Platform ("Client") and DevAgency Technologies ("Consultant").

1. ENGAGEMENT SCOPE
Consultant shall deliver enterprise software architecture design, API security hardening, and database optimization over a 10-month engagement ending November 15, 2026.

2. FEES AND MILESTONES
Client shall pay a monthly retainer of $18,000 on Net 15 terms. Total contract engagement fee equals $180,000.

--- Page 2 ---
3. INTELLECTUAL PROPERTY TRANSFERS
Deliverables and created source code shall become property of Client only upon complete settlement of all invoiced amounts for that phase.

4. TERMINATION FOR CONVENIENCE
Either party may terminate without cause upon fourteen (14) calendar days written notice. This engagement has a fixed duration and does not auto-renew."""
    },
    {
        "id": "DEMO-VND-06",
        "name": "Global Cloud Hardware & Vendor Supply Agreement",
        "contract_type": "Vendor Agreement",
        "company": "Apex Operations Ltd.",
        "status": "Review Required",
        "risk_level": "High",
        "payment_status": "Payment Due Soon",
        "is_demo": True,
        "start_date": "2024-10-01",
        "expiry_date": "2026-10-31",
        "renewal_date": "2026-11-01",
        "notice_period": "30 days written notice before term expiration (Deadline: 2026-10-01 — Notice Passed)",
        "payment_terms": "Quarterly billing ($45,000 per quarter) Net 30. Q4 Invoice #8841 pending.",
        "penalty_info": "Uncapped liability for service interruptions; 2% monthly late payment surcharge.",
        "summary": "Critical hardware co-location and vendor procurement agreement. Contract expires on October 31, 2026, and the 30-day non-renewal cutoff (October 1, 2026) has already passed, triggering an automatic 1-year renewal with an 8% price increase unless renegotiated immediately.",
        "customer": "ContractIQ Infrastructure",
        "vendor": "Apex Operations Ltd.",
        "legal_owner": "Sarah Jenkins",
        "clauses": [
            "Apex Operations supplies dedicated enterprise server chassis and high-bandwidth interconnects in Tier-3 datacenter facilities.",
            "Agreement automatically renews for successive 12-month terms unless written notice of non-renewal is provided at least thirty (30) days prior to term expiration.",
            "Annual fee shall increase by eight percent (8%) upon each renewal period without requiring separate written amendment.",
            "Vendor excludes liability for consequential damages except for gross negligence, willful misconduct, or unauthorized data exposure."
        ],
        "risks": [
            "HIGH RISK: Renewal notice window passed (October 1, 2026); contract is rolling over into 2027 with automatic 8% price escalator.",
            "PAYMENT DUE SOON: Q4 Invoice #8841 ($45,000) is due within the current billing cycle.",
            "Contains uncapped liability exceptions for operational network disruptions."
        ],
        "extracted_text": """--- Page 1 ---
GLOBAL CLOUD HARDWARE & VENDOR SUPPLY AGREEMENT

This Agreement is entered into on October 1, 2024, between ContractIQ Infrastructure ("Customer") and Apex Operations Ltd. ("Vendor").

1. HARDWARE PROCUREMENT
Vendor provides enterprise server hardware leases, rack space, and 10Gbps dedicated optical transit lines.

2. FEES AND BILLING
Customer shall be billed $45,000 per quarter on Net 30 payment terms. Total initial two-year contract value is $360,000.

--- Page 2 ---
3. TERM AND AUTOMATIC ROLLOVER
The initial term expires on October 31, 2026. The contract automatically renews on November 1, 2026 for twelve (12) months unless Customer delivers written termination notice at least thirty (30) days prior to expiration (October 1, 2026).

4. PRICE ADJUSTMENT UPON RENEWAL
Upon each renewal, Vendor shall apply an automatic eight percent (8%) price increase across all recurring equipment fees."""
    },
    {
        "id": "DEMO-MSA-07",
        "name": "Enterprise Master Services Agreement",
        "contract_type": "Master Services Agreement",
        "company": "ProviderTech Global Ltd.",
        "status": "Active",
        "risk_level": "Moderate",
        "payment_status": "Paid",
        "is_demo": True,
        "start_date": "2024-04-01",
        "expiry_date": "2027-03-31",
        "renewal_date": "2027-04-01",
        "notice_period": "60 days advance written notice prior to renewal date (Deadline: 2027-01-30)",
        "payment_terms": "Statements of Work (SOW) milestone billing, Net 45 payment terms.",
        "penalty_info": "Liquidated damages equal to 10% of SOW fee for milestone delays exceeding 30 calendar days.",
        "summary": "Enterprise framework agreement governing all professional service engagements, Statements of Work, and engineering contracting. Multi-year term expiring in March 2027 with auto-renewal and a 60-day advance notice requirement.",
        "customer": "ContractIQ Corp",
        "vendor": "ProviderTech Global Ltd.",
        "legal_owner": "Daniel Moreau",
        "clauses": [
            "This Master Agreement establishes the standard contractual framework governing all subsequent Statements of Work (SOWs) executed by the parties.",
            "Agreement shall renew automatically for successive one-year terms unless either party gives written notice of termination at least sixty (60) days prior to the end of the term.",
            "Each party agrees to indemnify, defend, and hold harmless the other from third-party claims arising from gross negligence or willful misconduct.",
            "All intellectual property developed pursuant to an SOW shall be owned exclusively by Customer as 'work made for hire.'"
        ],
        "risks": [
            "Liquidated damages clause triggers financial penalties if project milestone delivery is delayed by vendor.",
            "Annual renewal requires 60-day advance review window before January 30, 2027."
        ],
        "extracted_text": """--- Page 1 ---
ENTERPRISE MASTER SERVICES AGREEMENT

This Master Services Agreement ("MSA") is entered into on April 1, 2024, by and between ContractIQ Corp ("Client") and ProviderTech Global Ltd. ("Service Provider").

1. SCOPE AND STATEMENTS OF WORK
All services, timelines, and fees shall be specified in individually executed Statements of Work (SOWs) subject to the overarching terms of this MSA.

2. PAYMENT TERMS
Invoices under active SOWs shall be payable on Net 45 terms. Total estimated multi-year value of active SOWs is approximately $420,000.

--- Page 2 ---
3. TERM AND AUTOMATIC EXTENSION
The initial three-year term expires on March 31, 2027. It shall renew automatically for successive one (1) year terms unless either party delivers written notice of non-renewal at least sixty (60) days prior to March 31.

4. INTELLECTUAL PROPERTY & REMEDIES
All custom deliverables are works-made-for-hire owned by Client upon creation. Delays over 30 days trigger liquidated damages of 10% of the milestone fee."""
    },
    {
        "id": "DEMO-RNT-08",
        "name": "Commercial Office Lease Agreement",
        "contract_type": "Commercial Rental Agreement",
        "company": "Metro Real Estate Holdings",
        "status": "Review Required",
        "risk_level": "High",
        "payment_status": "Payment Due Soon",
        "is_demo": True,
        "start_date": "2023-11-01",
        "expiry_date": "2026-10-31",
        "renewal_date": "2026-11-01",
        "notice_period": "90 days formal written option notice (Notice deadline was 2026-08-02 — Expired)",
        "payment_terms": "$52,000 monthly base rent plus common area maintenance (CAM), Net 5.",
        "penalty_info": "Holdover penalty: 150% of monthly base rent if premises not vacated by October 31, 2026.",
        "summary": "Headquarters office lease for 12,000 sq ft commercial space. Three-year term terminates on October 31, 2026 (in 19 days). The 90-day option notice deadline passed in August 2026, exposing tenant to 150% holdover rent penalties unless an immediate lease extension amendment is executed.",
        "customer": "ContractIQ Tech Hub",
        "vendor": "Metro Real Estate Holdings LLC",
        "legal_owner": "David Miller",
        "clauses": [
            "Tenant leases 12,000 rentable square feet comprising Suite 400 at Metro Tower for commercial corporate office use.",
            "Base monthly rent of $52,000 shall be paid on or before the first day of each calendar month, subject to standard CAM reconciliation.",
            "Tenant had the option to extend the lease term for three (3) years by providing written notice to Landlord at least ninety (90) days prior to expiration.",
            "Failure to vacate upon expiration of the term shall constitute a tenancy at sufferance with rent payable at 150% of the last applicable monthly base rent."
        ],
        "risks": [
            "HIGH RISK: Lease expires in 19 days (October 31, 2026). Renewal option deadline (August 2, 2026) has lapsed.",
            "CRITICAL EXPOSURE: Holdover penalty rate of 150% ($78,000/mo) applies immediately starting November 1, 2026.",
            "October rent ($52,000) and pending CAM adjustments require immediate administrative settlement."
        ],
        "extracted_text": """--- Page 1 ---
COMMERCIAL OFFICE LEASE AGREEMENT

This Commercial Lease Agreement is executed on November 1, 2023, by Metro Real Estate Holdings LLC ("Landlord") and ContractIQ Tech Hub ("Tenant").

1. PREMISES
Landlord leases to Tenant 12,000 sq ft situated at Suite 400, Metro Tower, 100 Financial Way.

2. RENT AND OPERATING EXPENSES
Tenant shall pay monthly base rent of $52,000 on Net 5 terms (due on the 1st of each month). Total three-year initial lease value is $1,872,000.

--- Page 2 ---
3. TERM AND EXTENSION OPTION
The lease term ends October 31, 2026. Tenant held a single option to extend for three (3) years, conditioned on providing formal written notice at least ninety (90) days prior to expiration (August 2, 2026).

4. HOLDOVER SURCHARGE
If Tenant holds over possession after October 31, 2026 without an executed extension amendment, monthly rent shall increase to 150% of the base rate ($78,000/month)."""
    }
]


def seed_demo_contracts(db: Session, admin_user_id: Optional[str] = None) -> List[str]:
    """
    Seeds the canonical set of 8 realistic demo contracts idempotently.
    - Upserts demo contracts without creating duplicates.
    - Syncs clauses, risk indicators, and vector embeddings.
    - Fixes dates for existing user test contracts (e.g. CON-F6F8).
    - Preserves genuine user contracts.
    """
    processed_ids = []

    # 1. Clean up old synthetic duplicate demo records (marked is_demo = True with obsolete temporary IDs)
    canonical_ids = {c["id"] for c in CANONICAL_DEMO_CONTRACTS}
    old_demos = db.query(Contract).filter(
        Contract.is_demo == True,
        ~Contract.id.in_(canonical_ids)
    ).all()
    for old in old_demos:
        db.delete(old)
    db.commit()

    # 2. Upsert Canonical Demo Contracts
    for item in CANONICAL_DEMO_CONTRACTS:
        cid = item["id"]
        processed_ids.append(cid)

        clauses_data = item.get("clauses", [])
        risks_data = item.get("risks", [])
        extracted_text = item.get("extracted_text", "")

        contract = db.query(Contract).filter(Contract.id == cid).first()
        if not contract:
            contract = Contract(
                id=cid,
                owner_id=admin_user_id,
                name=item["name"],
                contract_type=item["contract_type"],
                company=item["company"],
                status=item["status"],
                risk_level=item["risk_level"],
                payment_status=item.get("payment_status", "Paid"),
                is_demo=True,
                start_date=item["start_date"],
                expiry_date=item["expiry_date"],
                renewal_date=item["renewal_date"],
                notice_period=item["notice_period"],
                payment_terms=item["payment_terms"],
                penalty_info=item["penalty_info"],
                summary=item["summary"],
                customer=item["customer"],
                vendor=item["vendor"],
                legal_owner=item["legal_owner"],
                extracted_text=extracted_text,
                file_name=f"{cid}.pdf",
                file_size="1.2 MB",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(contract)
            db.commit()
            db.refresh(contract)
        else:
            contract.name = item["name"]
            contract.contract_type = item["contract_type"]
            contract.company = item["company"]
            contract.status = item["status"]
            contract.risk_level = item["risk_level"]
            contract.payment_status = item.get("payment_status", "Paid")
            contract.is_demo = True
            contract.start_date = item["start_date"]
            contract.expiry_date = item["expiry_date"]
            contract.renewal_date = item["renewal_date"]
            contract.notice_period = item["notice_period"]
            contract.payment_terms = item["payment_terms"]
            contract.penalty_info = item["penalty_info"]
            contract.summary = item["summary"]
            contract.customer = item["customer"]
            contract.vendor = item["vendor"]
            contract.legal_owner = item["legal_owner"]
            contract.extracted_text = extracted_text
            contract.updated_at = datetime.utcnow()
            if admin_user_id and not contract.owner_id:
                contract.owner_id = admin_user_id
            db.commit()

        # Sync Clauses
        db.query(Clause).filter(Clause.contract_id == cid).delete()
        for idx, cl_text in enumerate(clauses_data):
            clause_obj = Clause(
                contract_id=cid,
                clause_type=item["contract_type"],
                text=cl_text,
                page_number=(idx // 2) + 1
            )
            db.add(clause_obj)

        # Sync Risk Indicators
        db.query(RiskIndicator).filter(RiskIndicator.contract_id == cid).delete()
        for r_text in risks_data:
            risk_obj = RiskIndicator(
                contract_id=cid,
                description=r_text,
                severity=item["risk_level"]
            )
            db.add(risk_obj)

        db.commit()

        # Vector Store chunking & pgvector indexing for RAG Assistant (only if not already indexed)
        try:
            from app.models.chunk import ContractChunk
            has_chunks = db.query(ContractChunk).filter(ContractChunk.contract_id == cid).first()
            if not has_chunks:
                chunks = chunk_contract_text(extracted_text)
                if chunks:
                    vs = VectorStore(cid)
                    vs.add_chunks(chunks, db=db)
        except Exception as ve:
            print(f"[Demo Seed VectorStore Warning for {cid}]: {ve}")

    # 3. Fix specific user test contracts if present (from user's screenshots)
    patch_contracts = {
        "CON-F6F8": {
            "start_date": "2026-03-01",
            "expiry_date": "2027-02-28",
            "renewal_date": "2027-03-01",
            "notice_period": "90 days prior to annual renewal (Deadline: 2026-12-01)",
            "payment_terms": "Net 30 terms ($12,500 monthly rent; $150,000/yr)",
            "payment_status": "Paid",
            "status": "Active",
            "risk_level": "Low"
        },
        "CON-C125": {
            "start_date": "2025-10-01",
            "expiry_date": "2027-10-01",
            "renewal_date": "Not applicable",
            "notice_period": "30 days written notice",
            "payment_terms": "Not applicable ($0 / Mutual consideration)",
            "status": "Active",
            "risk_level": "Low"
        },
        "CON-37D7": {
            "start_date": "2024-04-01",
            "expiry_date": "2027-03-31",
            "renewal_date": "2027-04-01",
            "notice_period": "60 days prior written notice",
            "payment_terms": "Statements of Work milestone billing, Net 45 terms",
            "status": "Active",
            "risk_level": "Moderate"
        },
        "CON-6D5E": {
            "start_date": "2026-02-10",
            "expiry_date": "2028-02-10",
            "renewal_date": "Not applicable",
            "notice_period": "30 days written notice",
            "payment_terms": "Not applicable ($0 / Mutual consideration)",
            "status": "Active",
            "risk_level": "Low"
        },
        "CON-5B5B": {
            "start_date": "2026-01-15",
            "expiry_date": "2026-11-15",
            "renewal_date": "Not applicable",
            "notice_period": "14 days written notice for convenience",
            "payment_terms": "$18,000 monthly retainer across 10 months, Net 15",
            "status": "Review Required",
            "risk_level": "High"
        }
    }

    for patch_id, patch_data in patch_contracts.items():
        patch_c = db.query(Contract).filter(Contract.id == patch_id).first()
        if patch_c:
            for k, v in patch_data.items():
                setattr(patch_c, k, v)
            db.commit()

    # 4. Generate deadline notifications for newly seeded dates
    try:
        generate_deadline_notifications(db)
        db.commit()
    except Exception as ne:
        print(f"[Demo Seed Notifications Warning]: {ne}")

    return processed_ids
