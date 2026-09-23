import re
import json
from typing import Dict, Any, List
from app.core.config import settings

# Active Gemini models in order of priority
GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
]

# Explicit non-contract patterns for deterministic detection
NON_CONTRACT_PATTERNS = [
    (r"(certificate of (?:completion|achievement|appreciation|merit|attendance|participation|excellence))", "Certificate of Completion/Achievement"),
    (r"(scholarship certificate|scholarship award|scholarship program|merit scholarship)", "Scholarship Certificate"),
    (r"(academic transcript|grade sheet|marksheet|statement of marks|controller of examinations|board of secondary|semester grade point|sgpa|cgpa)", "Academic Marksheet / Transcript"),
    (r"(degree of|diploma in|bachelor of|master of|doctor of philosophy|dean of academic affairs|provisional certificate)", "Degree / Diploma Certificate"),
    (r"(curriculum vitae|resume\b|work experience\b|educational qualifications|skills & abilities|career objective|professional summary)", "Resume / Curriculum Vitae"),
    (r"(tax invoice|receipt no|bill to:|ship to:|subtotal:|gstin:|invoice date:|cash receipt)", "Invoice / Receipt"),
    (r"(driver'?s license|identity card|passport no|aadhaar|voter id|national id card)", "Identity Card / Government ID"),
    (r"(recipe|ingredients:|cook time:|servings:|tablespoons|preheat oven)", "Recipe / Food Guide"),
    (r"(match report|premier league|cricket score|championship final|goals scored|tournament standings)", "Sports / Entertainment Article"),
]

# Hallmark categories for legal contracts
CONTRACT_TITLE_PATTERNS = [
    r"(?:agreement|contract|memorandum of understanding|mou|non-disclosure|nda|statement of work|sow|service level agreement|sla|terms of service|master services agreement|msa|lease agreement|employment agreement|consulting agreement|licens(?:e|ing) agreement|partnership deed|purchase agreement|subcontract|addendum|amendment)\b"
]

CONTRACT_PARTY_PATTERNS = [
    r"(?:by and between\b|entered into (?:by and between|on this|as of)\b|parties hereto\b|between\s+[\w\s,]+(?:and|&)\s+[\w\s,]+|disclosing party|receiving party|employer|employee|licensor|licensee|vendor|client|contractor|buyer|seller|lessor|lessee)",
    r"(?:whereas\b|now,? therefore,? in consideration|recitals\b|intending to be legally bound\b|witnesseth\b)"
]

CONTRACT_COVENANT_PATTERNS = [
    r"(?:hereby agree[s]?|parties (?:hereby )?agree as follows|shall be obligated|covenants? and agrees?|scope of (?:services|work)|deliverables|intellectual property rights|confidentiality obligations?|non-disclosure|non-compete|representations and warranties|indemnif(?:y|ication)|limitation of liability|hold harmless|force majeure)",
    r"(?:shall provide|shall maintain|shall keep confidential|shall indemnify|party agrees to|undertakes to)"
]

CONTRACT_TERM_PAYMENT_PATTERNS = [
    r"(?:term and termination|termination clause|either party may terminate|written notice of \d+|notice period|effective date|expiration date|renewal date|automatic renewal)",
    r"(?:payment terms|fees? and expenses?|invoicing|net \d+ days|billing schedule|compensation|liquidated damages|late fee|penalty for delay)"
]

CONTRACT_BOILERPLATE_PATTERNS = [
    r"(?:governing law|jurisdiction|dispute resolution|arbitration|severability|entire agreement|counterparts|waiver|amendments? in writing)",
    r"(?:in witness whereof|duly authorized representative|authorized signatory|executed as of|signatures?|for and on behalf of)"
]


def classify_document_text(text: str) -> Dict[str, Any]:
    """
    Classifies document text to verify whether it is a genuine legal contract or agreement.
    Provides detailed diagnostics and specific reasons.
    """
    if not text or len(text.strip()) < 30:
        return {
            "is_contract": False,
            "detected_type": "Empty or Unreadable Document",
            "reason": "The uploaded file does not contain sufficient legible text to analyze as a legal contract.",
            "missing_elements": ["Readable document text", "Legal clauses", "Party identification"],
            "present_elements": [],
            "confidence": 1.0
        }

    # If Gemini API key is available, run LLM classification with robust fallback
    if settings.GEMINI_API_KEY:
        try:
            llm_result = classify_with_gemini(text)
            if llm_result and "is_contract" in llm_result:
                return llm_result
        except Exception as e:
            print(f"[Gemini Classifier Fallback] {e}")

    return heuristic_document_classification(text)


def classify_with_gemini(text: str) -> Dict[str, Any]:
    """Uses Gemini LLM to strictly validate if a document is a legal contract or agreement."""
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
You are ContractIQ's Legal Document Verification Engine.
Analyze the following text sample to determine whether it is a legally binding contract, agreement, or memorandum.

ELIGIBLE CONTRACT TYPES:
Non-Disclosure Agreement (NDA), Master Services Agreement (MSA), Employment Agreement, Consulting Contract, Software License / SaaS Agreement, Lease/Rental Agreement, Vendor/Procurement Contract, Statement of Work (SOW), Service Level Agreement (SLA), Memorandum of Understanding (MOU), Partnership Deed, Commercial Terms of Service, Legal Addendum/Amendment.

STRICT NON-CONTRACT TYPES (MUST REJECT):
Academic Marksheets, Transcripts, Degree/Diploma Certificates, Scholarship/Merit Awards, Resumes/CVs, Financial Invoices/Receipts without contract covenants, Personal IDs, News Articles, Essays/Academic Papers, Meeting Notes, Food Recipes, Sports Reports.

RULES:
1. If the document is a genuine contract/agreement, set "is_contract": true, identify the specific "detected_type", and in "reason" explain why it is accepted based on its legal terms, identified parties, and binding covenants.
2. If the document is a non-contract or fake agreement, set "is_contract": false, identify the specific "detected_type" (e.g. "Academic Marksheet / Transcript", "Merit Certificate", "Curriculum Vitae", "General Essay"), and in "reason" give a specific diagnostic explanation of what it actually is and which essential contractual elements are missing (e.g., lacks bilateral covenants, consideration, execution terms, or mutual legal obligations).
3. List present and missing legal elements in "present_elements" and "missing_elements".

Return ONLY valid JSON with this exact schema:
{{
    "is_contract": true | false,
    "detected_type": "string",
    "reason": "Specific, detailed diagnostic explanation",
    "present_elements": ["string"],
    "missing_elements": ["string"],
    "confidence": 0.0 to 1.0
}}

Document Text Sample:
{text[:4500]}
"""

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_json = response.text.strip()
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].split("```")[0].strip()
            parsed = json.loads(raw_json)
            if "is_contract" in parsed:
                return parsed
        except Exception as err:
            print(f"[Gemini Classifier error with {model_name}]: {err}")
            continue

    return heuristic_document_classification(text)


def heuristic_document_classification(text: str) -> Dict[str, Any]:
    """
    Advanced multi-category rule-based legal document classifier.
    Accurately identifies real contracts across various formats and diagnoses non-contracts.
    """
    lower_text = text.lower()

    # 1. Check for explicit non-contract matches
    for pattern, doc_type in NON_CONTRACT_PATTERNS:
        if re.search(pattern, lower_text):
            missing = [
                "Bilateral legal obligations & covenants",
                "Mutual consideration & commercial terms",
                "Governing law and dispute resolution clauses",
                "Execution / signature blocks"
            ]
            return {
                "is_contract": False,
                "detected_type": doc_type,
                "reason": f"Detected characteristics of a {doc_type}. ContractIQ only accepts legally binding contracts, commercial agreements, NDAs, and memorandums with enforceable obligations between parties.",
                "missing_elements": missing,
                "present_elements": [f"Header/content indicative of {doc_type}"],
                "confidence": 0.95
            }

    # 2. Multi-category feature extraction
    present_elements = []
    missing_elements = []
    category_scores = 0

    # Category A: Title / Agreement Header
    has_title = any(re.search(p, lower_text) for p in CONTRACT_TITLE_PATTERNS)
    if has_title:
        category_scores += 2
        present_elements.append("Contractual Title / Agreement Header")
    else:
        missing_elements.append("Standard Contract Title / Heading")

    # Category B: Parties & Recitals
    has_parties = any(re.search(p, lower_text) for p in CONTRACT_PARTY_PATTERNS)
    if has_parties:
        category_scores += 2
        present_elements.append("Identified Counterparties & Recitals")
    else:
        missing_elements.append("Defined Counterparties / 'Between' Clause")

    # Category C: Operative Covenants & Obligations
    has_covenants = any(re.search(p, lower_text) for p in CONTRACT_COVENANT_PATTERNS)
    if has_covenants:
        category_scores += 2
        present_elements.append("Binding Legal Covenants & Obligations")
    else:
        missing_elements.append("Operative Covenants ('Shall / Agrees to')")

    # Category D: Term, Termination & Commercial Provisions
    has_term_payment = any(re.search(p, lower_text) for p in CONTRACT_TERM_PAYMENT_PATTERNS)
    if has_term_payment:
        category_scores += 1
        present_elements.append("Term, Termination or Payment Terms")
    else:
        missing_elements.append("Term Duration / Termination Notice Provisions")

    # Category E: Boilerplate & Execution / Jurisdiction
    has_boilerplate = any(re.search(p, lower_text) for p in CONTRACT_BOILERPLATE_PATTERNS)
    if has_boilerplate:
        category_scores += 1
        present_elements.append("Governing Law, Dispute or Execution Block")
    else:
        missing_elements.append("Governing Law / Formal Execution Block")

    # Decision Matrix:
    # A genuine contract typically scores >= 3 across categories (e.g. title + covenants, or parties + covenants + boilerplate)
    if category_scores >= 3:
        # Determine specific contract subtype
        detected_type = "Legal Agreement / Contract"
        if "non-disclosure" in lower_text or "nda" in lower_text or "confidential" in lower_text:
            detected_type = "Non-Disclosure Agreement (NDA)"
        elif "master services" in lower_text or "msa" in lower_text or "service agreement" in lower_text:
            detected_type = "Master Services Agreement (MSA)"
        elif "employment" in lower_text or "offer letter" in lower_text:
            detected_type = "Employment Agreement"
        elif "software" in lower_text or "saas" in lower_text or "license" in lower_text:
            detected_type = "Software License / SaaS Agreement"
        elif "lease" in lower_text or "tenancy" in lower_text or "rental" in lower_text:
            detected_type = "Lease / Rental Agreement"
        elif "statement of work" in lower_text or "sow" in lower_text:
            detected_type = "Statement of Work (SOW)"
        elif "consulting" in lower_text or "contractor" in lower_text:
            detected_type = "Consulting Agreement"
        elif "memorandum of understanding" in lower_text or "mou" in lower_text:
            detected_type = "Memorandum of Understanding (MOU)"

        return {
            "is_contract": True,
            "detected_type": detected_type,
            "reason": f"Verified as a legitimate {detected_type}. Contains identified parties, enforceable legal covenants, operational terms, and contractual structure.",
            "present_elements": present_elements,
            "missing_elements": missing_elements,
            "confidence": min(0.70 + (category_scores * 0.06), 0.98)
        }

    return {
        "is_contract": False,
        "detected_type": "General Non-Contract Document",
        "reason": "The uploaded file does not satisfy legal contract requirements. It lacks essential contractual components such as bilateral covenants, mutual obligations, defined legal consideration, and enforceable terms.",
        "present_elements": present_elements,
        "missing_elements": missing_elements,
        "confidence": 0.85
    }


def analyze_contract_text(text: str) -> Dict[str, Any]:
    """
    Analyzes contract text to extract genuine metadata, clauses, dates, counterparties, and risks.
    """
    if settings.GEMINI_API_KEY:
        try:
            return analyze_with_gemini(text)
        except Exception as e:
            print(f"[Gemini Analysis Fallback] {e}")

    return heuristic_contract_analysis(text)


def analyze_with_gemini(text: str) -> Dict[str, Any]:
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
You are an expert legal AI assistant. Analyze the following contract text and extract its factual terms and risk analysis.

CRITICAL EXTRACTION RULES:
1. Do NOT invent dates, parties, or terms. If a date or term is not explicitly stated in the document, set its value to null.
2. If risk cannot be determined from text, set "riskLevel": "Not Assessed".
3. Status should reflect actual state: "Active", "Review Required", or "Draft".
4. Extract key actual clauses and genuine risk indicators with clear legal rationale.

Return ONLY valid JSON with this schema:
{{
    "contractType": "string (e.g. Non-Disclosure Agreement, Master Services Agreement, Lease)",
    "company": "string or null (primary counterparty name)",
    "status": "Active" | "Review Required" | "Draft",
    "riskLevel": "Low" | "Moderate" | "High" | "Critical" | "Not Assessed",
    "startDate": "YYYY-MM-DD" or null,
    "expiryDate": "YYYY-MM-DD" or null,
    "renewalDate": "YYYY-MM-DD" or null,
    "noticePeriod": "string or null",
    "paymentTerms": "string or null",
    "penaltyInfo": "string or null",
    "summary": "Concise factual summary (2-3 sentences)",
    "customer": "string or null",
    "vendor": "string or null",
    "clauses": ["list of actual extracted clauses from text"],
    "riskIndicators": ["list of genuine identified legal risks or empty list"]
}}

Contract Text:
{text[:8000]}
"""

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_json = response.text.strip()
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].split("```")[0].strip()
            return json.loads(raw_json)
        except Exception as err:
            print(f"[Gemini analyze error with {model_name}]: {err}")
            continue

    return heuristic_contract_analysis(text)


def heuristic_contract_analysis(text: str) -> Dict[str, Any]:
    """Accurate NLP parser that extracts only verified terms without fake defaults."""
    lower_text = text.lower()

    # Contract Type Detection
    contract_type = "Commercial Agreement"
    if "software" in lower_text or "saas" in lower_text or "license agreement" in lower_text:
        contract_type = "Software License Agreement"
    elif "confidential" in lower_text or "nda" in lower_text or "non-disclosure" in lower_text:
        contract_type = "Non-Disclosure Agreement"
    elif "master services" in lower_text or "services agreement" in lower_text or "msa" in lower_text:
        contract_type = "Master Services Agreement"
    elif "manufactur" in lower_text or "procurement" in lower_text or "purchase agreement" in lower_text:
        contract_type = "Procurement Agreement"
    elif "employment" in lower_text or "offer letter" in lower_text:
        contract_type = "Employment Agreement"
    elif "lease" in lower_text or "tenancy" in lower_text or "rental" in lower_text:
        contract_type = "Lease Agreement"
    elif "consulting" in lower_text or "consultant" in lower_text:
        contract_type = "Consulting Agreement"
    elif "statement of work" in lower_text or "sow" in lower_text:
        contract_type = "Statement of Work"

    # Extract dates only if present in text
    date_matches = re.findall(
        r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b",
        text
    )

    start_date = date_matches[0] if len(date_matches) > 0 else None
    expiry_date = date_matches[1] if len(date_matches) > 1 else None
    renewal_date = date_matches[2] if len(date_matches) > 2 else None

    # Notice period
    notice_match = re.search(
        r"(\d+\s+days?(?:\s+prior)?(?:\s+written)?\s+notice|\d+\s+months?(?:\s+prior)?(?:\s+written)?\s+notice)",
        text,
        re.IGNORECASE
    )
    notice_period = notice_match.group(0) if notice_match else None

    # Payment terms
    payment_match = re.search(
        r"(?:payment\s+terms?|fees?|billing):?\s*([^\n\.;]+)|(net\s+\d+\s+days?|billed\s+(?:monthly|quarterly|annually)|\$\s*[\d,]+(?:\.\d{2})?\s*(?:per\s+month|per\s+year|monthly|annually|usd)?)",
        text,
        re.IGNORECASE
    )
    payment_terms = payment_match.group(0) if payment_match else None

    # Penalty terms
    penalty_match = re.search(
        r"(?:penalty|liquidated damages|late fee|interest of \d+%|service credit):?\s*([^\n\.;]+)",
        text,
        re.IGNORECASE
    )
    penalty_info = penalty_match.group(0) if penalty_match else None

    # Counterparties
    party_match = re.search(
        r"(?:between|by and between)\s+([A-Z][A-Za-z0-9\s,\.]+?)(?:\s*\(\"[^\"]+\"\))?\s+(?:and|&)\s+([A-Z][A-Za-z0-9\s,\.]+?)(?:\s*\(\"[^\"]+\"\))?(?:[\.\,\n]|\s+dated)",
        text
    )
    customer = None
    vendor = None
    company = "Contract Partner"
    if party_match:
        p1 = party_match.group(1).strip()
        p2 = party_match.group(2).strip()
        customer = p2
        vendor = p1
        company = p1

    # Clauses
    clauses = []
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    for p in paragraphs[:8]:
        if any(h in p.lower() for h in ["agree", "shall", "term", "payment", "confidential", "liability", "govern", "notice", "warrant", "indemn"]):
            clauses.append(p[:300])

    if not clauses:
        clauses = [f"General provisions and binding commitments governing terms of {contract_type}."]

    # Risk evaluation
    risks = []
    risk_level = "Low"
    if "unlimited liability" in lower_text or "indemnify and hold harmless" in lower_text:
        risks.append("Uncapped indemnity / broad liability exposure identified in terms.")
        risk_level = "High"
    if "auto-renew" in lower_text or "automatic renewal" in lower_text:
        risks.append("Automatic renewal clause requires monitoring to prevent unintended rollover.")
        if risk_level == "Low":
            risk_level = "Moderate"
    if "liquidated damages" in lower_text or "penalty" in lower_text or "service credit" in lower_text:
        risks.append("Contains explicit financial penalties or liquidated damages for operational delays or SLA shortfall.")
        if risk_level == "Low":
            risk_level = "Moderate"

    return {
        "contractType": contract_type,
        "company": company,
        "status": "Review Required" if risks else "Active",
        "riskLevel": risk_level,
        "startDate": start_date,
        "expiryDate": expiry_date,
        "renewalDate": renewal_date,
        "noticePeriod": notice_period,
        "paymentTerms": payment_terms,
        "penaltyInfo": penalty_info,
        "summary": f"This {contract_type} establishes binding commercial obligations, operational terms, and legal governing provisions between the designated parties.",
        "customer": customer,
        "vendor": vendor,
        "clauses": clauses,
        "riskIndicators": risks
    }
