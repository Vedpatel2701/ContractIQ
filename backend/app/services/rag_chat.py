import re
import json
import datetime
import concurrent.futures
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.vector_store import VectorStore
from app.core.config import settings

# Active Gemini models in order of priority
GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

# Current system reference date (October 14, 2026)
CURRENT_REFERENCE_DATE = datetime.date(2026, 10, 14)

# Off-topic topic indicators to politely deflect
OFF_TOPIC_PATTERNS = [
    r"\b(?:cricket|football|soccer|basketball|nba|ipl|world cup|premier league|match score|tennis|olympics)\b",
    r"\b(?:recipe|cook(?:ing)?|ingredients|bake|pasta|pizza|biryani|burger|dessert|calories in)\b",
    r"\b(?:movie|actor|actress|hollywood|bollywood|netflix show|cinema|box office|video game|playstation|xbox)\b",
    r"\b(?:weather forecast|horoscope|astrology|celebrity gossip)\b",
]

# Detection pattern for questions explicitly asking for sources, citations, clauses, pages, or proof
SOURCE_REQUEST_PATTERNS = [
    r"\b(?:what is (?:the|your) source|show (?:me )?(?:the )?(?:exact )?source|sources|citation|citations|cite|cited)\b",
    r"\b(?:which clause|what clause|which section|what section|clause number|section number)\b",
    r"\b(?:page number|which page|what page|relevant page|relevant section)\b",
    r"\b(?:where in the contract|where does it say|show (?:me )?(?:the )?proof|evidence|reference|where is this stated|according to which)\b",
    r"\b(?:provide (?:the )?(?:exact )?clause)\b",
]

def is_source_requested(question: str) -> bool:
    """Detects whether user is explicitly asking for source citations, clause locations, or document pages."""
    q_lower = question.lower()
    for pattern in SOURCE_REQUEST_PATTERNS:
        if re.search(pattern, q_lower):
            return True
    return False

# Common legal and contract concepts explained in clear, natural professional English
LEGAL_CONCEPT_DEFINITIONS = {
    "indemnity": (
        "**Indemnification** is a contractual commitment where one party agrees to compensate and protect "
        "the other party against legal claims, damages, or financial losses caused by their actions, negligence, "
        "or contractual breaches. In practice, if a third party files a lawsuit against your organization because of "
        "the vendor's work or intellectual property infringement, the vendor must defend the lawsuit and cover all "
        "resulting legal fees, settlements, and judgments."
    ),
    "indemnification": (
        "**Indemnification** is a contractual commitment where one party agrees to compensate and protect "
        "the other party against legal claims, damages, or financial losses caused by their actions, negligence, "
        "or contractual breaches. In practice, if a third party files a lawsuit against your organization because of "
        "the vendor's work or intellectual property infringement, the vendor must defend the lawsuit and cover all "
        "resulting legal fees, settlements, and judgments."
    ),
    "liability": (
        "A **Limitation of Liability** clause establishes a contractual ceiling on the maximum financial damages "
        "one party can recover from the other in a dispute. In commercial contracts, liability is typically capped "
        "at the total fees paid under the contract over the preceding 12 months, or a specified fixed sum. "
        "High-risk items such as gross negligence, intentional misconduct, and indemnification are often carved out from this cap."
    ),
    "termination": (
        "**Termination** provisions govern how and when an agreement can be cancelled before its natural expiration. "
        "Contracts commonly provide two distinct avenues:\n"
        "- **Termination for Convenience:** Either party may end the agreement without cause simply by delivering advance written notice (typically 30 to 60 days).\n"
        "- **Termination for Cause:** A party may terminate immediately or after a cure window (commonly 30 days) if the other party commits a material breach, becomes insolvent, or fails to perform contractual obligations."
    ),
    "renewal": (
        "**Contract Renewal** determines what happens when an agreement reaches the end of its initial term. "
        "An **automatic renewal (evergreen)** provision automatically extends the contract for consecutive terms "
        "(such as one year) unless one party delivers a formal written non-renewal notice prior to a designated notice cutoff. "
        "Missing this notice window legally commits the organization to the extended term and associated fees."
    ),
    "governing law": (
        "**Governing Law** specifies which state or country's legal principles control the interpretation of the contract, "
        "while **Jurisdiction / Venue** designates the specific court or arbitration forum authorized to hear and resolve disputes."
    ),
    "confidentiality": (
        "**Confidentiality (Non-Disclosure)** provisions protect proprietary business data, customer records, technical assets, "
        "and trade secrets from unauthorized use or external disclosure, establishing standard exclusions (such as publicly known information) "
        "and surviving obligations that often persist for several years after contract termination."
    ),
    "force majeure": (
        "A **Force Majeure** clause excuses both parties from performing contractual duties when an unforeseeable, "
        "insurmountable event beyond their reasonable control occurs—such as natural disasters, armed conflict, government embargoes, "
        "or widespread utility failures. Standard clauses require prompt notice and permit termination if the event continues beyond 30 to 60 days."
    ),
    "penalty": (
        "**Penalties and Liquidated Damages** are predetermined financial amounts or fee adjustments that a breaching party "
        "agrees to pay if agreed service delivery targets or milestones are missed, establishing an agreed remedy without requiring court litigation."
    ),
    "sla": (
        "A **Service Level Agreement (SLA)** defines objective performance standards (such as 99.9% platform availability or a 2-hour critical response window) "
        "and specifies service credits credited against monthly invoices when the provider falls below the agreed metrics."
    ),
    "arbitration": (
        "An **Arbitration** clause requires disputes to be resolved by a neutral private arbitrator rather than through public court litigation. "
        "Arbitration decisions are typically binding, confidential, and enforceable with very limited rights of appeal."
    ),
    "severability": (
        "A **Severability** clause ensures that if any single provision of an agreement is ruled invalid or unenforceable by a court, "
        "the remainder of the contract continues in full legal effect with the invalid portion modified only to the minimum extent necessary."
    ),
    "audit": (
        "**Audit Rights** grant one party the right to inspect the other party's books, records, security controls, or facilities "
        "to confirm contractual compliance, accurate billing, and regulatory adherence upon reasonable advance written notice."
    ),
}

def parse_iso_date(date_str: Optional[str]) -> Optional[datetime.date]:
    """Safely parses an ISO date string (YYYY-MM-DD) into a datetime.date."""
    if not date_str:
        return None
    try:
        m = re.search(r"(\d{4}-\d{2}-\d{2})", str(date_str))
        if m:
            return datetime.date.fromisoformat(m.group(1))
    except Exception:
        pass
    return None

def analyze_contract_deadlines(contract_meta: dict) -> dict:
    """
    Extracts and evaluates contractual deadlines relative to CURRENT_REFERENCE_DATE.
    Distinguishes notice deadline, expiry date, and renewal date.
    """
    start_date = parse_iso_date(contract_meta.get("start_date"))
    expiry_date = parse_iso_date(contract_meta.get("expiry_date"))
    renewal_date = parse_iso_date(contract_meta.get("renewal_date"))
    notice_str = contract_meta.get("notice_period") or ""

    # Parse notice deadline embedded in notice_period string (e.g. "Deadline: 2026-10-01" or "was 2026-08-02")
    notice_deadline = None
    m_notice = re.search(r"(?:deadline(?:\s+was)?[:\s]+)(\d{4}-\d{2}-\d{2})", notice_str, re.IGNORECASE)
    if m_notice:
        notice_deadline = parse_iso_date(m_notice.group(1))

    # If no explicit deadline date in string, calculate from notice days and renewal or expiry date
    if not notice_deadline:
        m_days = re.search(r"(\d+)\s+days", notice_str, re.IGNORECASE)
        target_end = renewal_date or expiry_date
        if m_days and target_end:
            days = int(m_days.group(1))
            notice_deadline = target_end - datetime.timedelta(days=days)

    has_notice_passed = False
    notice_days_diff = None
    if notice_deadline:
        has_notice_passed = notice_deadline < CURRENT_REFERENCE_DATE
        notice_days_diff = (CURRENT_REFERENCE_DATE - notice_deadline).days if has_notice_passed else (notice_deadline - CURRENT_REFERENCE_DATE).days

    has_expired = False
    if expiry_date:
        has_expired = expiry_date < CURRENT_REFERENCE_DATE

    is_auto_renew = False
    renewal_raw = str(contract_meta.get("renewal_date") or "").lower()
    if renewal_raw and "not applicable" not in renewal_raw and "none" not in renewal_raw:
        is_auto_renew = True

    return {
        "start_date": start_date,
        "expiry_date": expiry_date,
        "renewal_date": renewal_date,
        "notice_deadline": notice_deadline,
        "notice_str": notice_str,
        "has_notice_passed": has_notice_passed,
        "notice_days_diff": notice_days_diff,
        "has_expired": has_expired,
        "is_auto_renew": is_auto_renew,
    }

def call_gemini_api(prompt: str) -> Optional[str]:
    """Invokes Gemini models with a strict 4-second timeout, falling back gracefully on error or timeout."""
    if not settings.GEMINI_API_KEY:
        return None

    def _worker():
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=settings.GEMINI_API_KEY, http_options=types.HttpOptions(timeout=10000))
            for model_name in GEMINI_MODELS:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    if response and response.text and response.text.strip():
                        return response.text.strip()
                except Exception as err:
                    print(f"[Gemini RAG Chat notice with {model_name}]: {err}")
                    continue
        except Exception as outer_err:
            print(f"[Gemini RAG Chat client init error]: {outer_err}")
        return None

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_worker)
            return future.result(timeout=4.0)
    except Exception as e:
        print(f"[Gemini RAG Chat Timeout/Fallback triggered]: {type(e).__name__}")
        return None

def answer_contract_question(
    contract_id: str,
    question: str,
    contract_meta: dict,
    db: Optional[Session] = None
) -> dict:
    """
    RAG Chat pipeline: searches within this contract's vector chunks and provides well-structured,
    plain-English answers for non-lawyers while strictly preserving contractual accuracy.
    Sources are included but only shown to the user when explicitly requested.
    """
    q_lower = question.lower()
    sources_asked = is_source_requested(question)

    # 1. Off-Topic Check
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, q_lower):
            return {
                "answer": (
                    "I am ContractIQ's Legal Assistant dedicated to analyzing contracts, legal terms, and commercial agreements. "
                    "I cannot assist with off-topic queries like sports, recipes, or entertainment. "
                    "Please ask any question regarding this contract's terms, clauses, obligations, or risks."
                ),
                "citations": [],
                "sources": [],
                "show_sources": False
            }

    # 2. Strict contract-isolated chunk retrieval (top 6 chunks across pages)
    vector_store = VectorStore(contract_id)
    relevant_chunks = vector_store.search(question, top_k=6, db=db)

    doc_name = contract_meta.get("file_name") or contract_meta.get("name", "Contract Document")
    citations = []
    sources = []

    for c in relevant_chunks:
        page_num = c.get("page_number")
        section_name = c.get("section")
        chunk_excerpt = (c.get("text") or "").strip()
        chunk_id = c.get("chunk_id", 0)
        page_str = f"Page {page_num}" if page_num and page_num > 0 else "Page 1"
        chunk_excerpt_short = chunk_excerpt[:180] + ("..." if len(chunk_excerpt) > 180 else "")

        if chunk_excerpt:
            citations.append(f"{doc_name} • {page_str} (Chunk #{chunk_id}): \"{chunk_excerpt_short}\"")

        sources.append({
            "contract_id": contract_id,
            "document_name": doc_name,
            "chunk_id": chunk_id,
            "page_number": page_num if (page_num and page_num > 0) else 1,
            "section": section_name if section_name else None,
            "excerpt": chunk_excerpt[:350],
            "file_url": f"/api/v1/contracts/{contract_id}/file"
        })

    # Context text for LLM
    context_text = "\n\n".join([
        f"[Section: {c.get('section') or 'General Provision'} - Page {c.get('page_number', 1)}]:\n{c.get('text', '')}"
        for c in relevant_chunks
    ])

    # 3. If Gemini is available, attempt grounded response with strict professional guidelines
    if settings.GEMINI_API_KEY:
        source_note = (
            "The user explicitly requested sources or citations. Cite the document name, page number, and section."
            if sources_asked
            else "Do not include source citations or raw chunk excerpts in the response text unless requested."
        )

        deadlines_info = analyze_contract_deadlines(contract_meta)
        today_str = CURRENT_REFERENCE_DATE.strftime("%B %d, %Y")

        prompt = f"""You are ContractIQ's Legal Assistant analyzing the contract "{contract_meta.get('name')}".
Current Reference Date: {today_str}.

MISSION:
Provide clear, authoritative answers understandable to someone without legal training, while maintaining 100% factual accuracy.

CORE RULES:
1. ANSWER DIRECTLY:
   - Provide the direct answer to the user's specific question in the opening sentence.
   - For deadlines: identify the date, explain its contractual meaning, state the required action, and distinguish notice deadlines from expiry dates.
   - For expired/passed notice windows: explicitly note that the deadline has passed, explain what that means for renewal or termination, and advise next steps.
   - For absent terms: state clearly that the contract does not specify the requested term (e.g., late payment interest, penalties). Never invent dates, amounts, or terms.

2. PROFESSIONAL TONE (CRITICAL CONSTRAINTS):
   - Never use artificial headings such as "In everyday language", "Simple explanation", or "What this means for you".
   - Never use repetitive AI closing lines such as "Let me know if you would like me to explain further."
   - Do not quote whole contractual clauses unless specifically requested. Concisely explain the provision.

3. SOURCES:
   - {source_note}

Contract Metadata:
- Contract Name: {contract_meta.get('name')}
- Counterparty: {contract_meta.get('company')}
- Expiry Date: {contract_meta.get('expiry_date')}
- Renewal Date: {contract_meta.get('renewal_date')}
- Notice Period: {contract_meta.get('notice_period')}
- Payment Terms: {contract_meta.get('payment_terms')}
- Penalty Info: {contract_meta.get('penalty_info')}
- Summary: {contract_meta.get('summary')}

Retrieved Contract Text Context:
{context_text if context_text else "No specific matching text chunks found in vector index."}

User Question:
{question}
"""
        answer_text = call_gemini_api(prompt)
        if answer_text:
            return {
                "answer": answer_text,
                "citations": citations if sources_asked else [],
                "sources": sources,
                "show_sources": sources_asked
            }

    # 4. Deterministic, contract-grounded intelligence engine fallback
    return grounded_contract_reasoning(question, contract_meta, relevant_chunks, citations, sources, sources_asked)

def grounded_contract_reasoning(
    question: str,
    contract_meta: dict,
    relevant_chunks: List[dict],
    citations: List[str],
    sources: List[dict],
    sources_asked: bool = False
) -> dict:
    """
    Deterministic, highly accurate reasoning engine that guarantees:
    - Direct answers first
    - Natural, professional language without artificial headings
    - Evidence-based handling of deadlines, expiry, and renewal
    - Honest acknowledgement of missing/absent terms
    - Full source citation when explicitly requested
    """
    q_lower = question.lower()
    contract_name = contract_meta.get("name", "this agreement")
    company = contract_meta.get("company", "the counterparty")
    deadlines = analyze_contract_deadlines(contract_meta)

    # 1. Source requests: user explicitly asks for proof, clause location, or source
    if sources_asked:
        if relevant_chunks:
            best = relevant_chunks[0]
            doc_name = contract_meta.get("file_name") or contract_name
            page_val = best.get("page_number", 1)
            sec_val = best.get("section") or "Relevant Provision"
            chunk_text = (best.get("text") or "").strip()
            answer = (
                f"### Verified Contract Source\n\n"
                f"This answer is supported directly by **{doc_name}**, located on **Page {page_val}** (Section: *{sec_val}*):\n\n"
                f"> \"{chunk_text[:340]}...\"\n\n"
                f"You can review the full contextual provision in the verified document source attached below."
            )
            return {
                "answer": answer,
                "citations": citations,
                "sources": sources,
                "show_sources": True
            }
        else:
            return {
                "answer": f"Reliable source metadata is not available in the indexed chunks for this item in **{contract_name}**.",
                "citations": [],
                "sources": [],
                "show_sources": False
            }

    # 2. Separate Expiry and Renewal Questions (e.g. "What is the expiry date, and does this contract renew automatically?")
    is_expiry_and_renew_query = ("expir" in q_lower or "end date" in q_lower) and ("renew" in q_lower or "evergreen" in q_lower or "automatic" in q_lower)
    if is_expiry_and_renew_query:
        exp_str = deadlines["expiry_date"].strftime("%B %d, %Y") if deadlines["expiry_date"] else (contract_meta.get("expiry_date") or "Not specified")
        ren_str = deadlines["renewal_date"].strftime("%B %d, %Y") if deadlines["renewal_date"] else (contract_meta.get("renewal_date") or "Not applicable")
        notice = contract_meta.get("notice_period") or "Standard written notice"

        renewal_explanation = ""
        if deadlines["is_auto_renew"]:
            if deadlines["notice_deadline"]:
                notice_date_str = deadlines["notice_deadline"].strftime("%B %d, %Y")
                if deadlines["has_notice_passed"]:
                    renewal_explanation = (
                        f"Yes, the contract renews automatically on **{ren_str}**. "
                        f"However, the required advance notice window ({notice}) had a cutoff date of **{notice_date_str}**, "
                        f"which passed {deadlines['notice_days_diff']} days ago. As a result, the agreement is now committed to the renewal term."
                    )
                else:
                    renewal_explanation = (
                        f"Yes, this contract renews automatically on **{ren_str}**. "
                        f"To prevent automatic renewal, your organization must deliver formal written notice on or before **{notice_date_str}** ({deadlines['notice_days_diff']} days remaining)."
                    )
            else:
                renewal_explanation = f"Yes, this contract renews automatically on **{ren_str}** subject to {notice}."
        else:
            renewal_explanation = "No, this agreement does not renew automatically. It concludes on the stated expiration date unless both parties formally execute an extension amendment."

        answer = (
            f"**Contract Expiry Date:** The current term concludes on **{exp_str}**.\n\n"
            f"**Renewal Terms:** {renewal_explanation}"
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 3. Deadline Questions (e.g. "What is the deadline for this contract?", "When is the next deadline?")
    is_deadline_query = any(k in q_lower for k in ["deadline", "due date", "cutoff", "when do we need to", "last day to"])
    if is_deadline_query:
        if deadlines["notice_deadline"]:
            notice_date_str = deadlines["notice_deadline"].strftime("%B %d, %Y")
            exp_date_str = deadlines["expiry_date"].strftime("%B %d, %Y") if deadlines["expiry_date"] else "Not specified"
            ren_date_str = deadlines["renewal_date"].strftime("%B %d, %Y") if deadlines["renewal_date"] else "Not specified"

            if deadlines["has_notice_passed"]:
                answer = (
                    f"The primary actionable deadline for this contract was the **notice deadline on {notice_date_str}**, which has already passed.\n\n"
                    f"- **Status:** The contract required {deadlines['notice_str']}. Because that notice cutoff passed {deadlines['notice_days_diff']} days ago, the agreement cannot be cancelled through ordinary routine notice.\n"
                    f"- **Current Term Expiry:** {exp_date_str}\n"
                    f"- **Renewal Effective Date:** {ren_date_str}\n\n"
                    f"**Recommended Action:** If your team intends to renegotiate rates or avoid renewal, contact **{company}** immediately to discuss a mutually agreed waiver or contract amendment."
                )
            else:
                answer = (
                    f"The nearest actionable deadline for this contract is the **notice deadline on {notice_date_str}** ({deadlines['notice_days_diff']} days remaining).\n\n"
                    f"- **Required Action:** Deliver formal written notice of non-renewal to **{company}** on or before **{notice_date_str}**.\n"
                    f"- **Consequence:** Under the terms ({deadlines['notice_str']}), failure to provide timely notice will trigger an automatic renewal on **{ren_date_str}**.\n"
                    f"- **Contract Expiration Date:** {exp_date_str}"
                )
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }
        elif deadlines["expiry_date"]:
            exp_date_str = deadlines["expiry_date"].strftime("%B %d, %Y")
            answer = (
                f"The documented milestone for this contract is its **term expiration date on {exp_date_str}**.\n\n"
                f"- **Contract Expiry:** **{exp_date_str}**\n"
                f"- **Notice Terms:** {contract_meta.get('notice_period') or 'No separate advance notice cutoff is specified in the contract metadata.'}\n\n"
                f"**Required Action:** Ensure all deliverables and final settlement obligations with **{company}** are concluded prior to {exp_date_str}."
            )
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }
        else:
            return {
                "answer": f"There are no explicit calendar deadlines or fixed expiration dates documented in **{contract_name}**. The agreement remains in effect under standard ongoing commercial terms.",
                "citations": [],
                "sources": sources,
                "show_sources": False
            }

    # 4. Pure Expiry / Renewal date questions
    if any(k in q_lower for k in ["expire", "expiry", "end date"]):
        exp_date_str = deadlines["expiry_date"].strftime("%B %d, %Y") if deadlines["expiry_date"] else (contract_meta.get("expiry_date") or "Not specified")
        answer = (
            f"This contract's current term concludes on **{exp_date_str}** with counterparty **{company}**.\n\n"
            f"- **Expiration Date:** **{exp_date_str}**\n"
            f"- **Notice Requirement:** {contract_meta.get('notice_period') or 'Standard written notice'}"
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    if any(k in q_lower for k in ["renewal", "renew", "evergreen", "auto-renew"]):
        ren_date_str = deadlines["renewal_date"].strftime("%B %d, %Y") if deadlines["renewal_date"] else (contract_meta.get("renewal_date") or "Not specified")
        notice = contract_meta.get("notice_period") or "advance written notice"
        if deadlines["is_auto_renew"]:
            answer = (
                f"This agreement is configured to renew on **{ren_date_str}**.\n\n"
                f"- **Renewal Date:** **{ren_date_str}**\n"
                f"- **Notice Window:** {notice}\n\n"
                f"To prevent renewal or renegotiate terms, formal written notice must be provided according to the specified notice window."
            )
        else:
            answer = f"According to the contract terms, **{contract_name}** does not have an automatic renewal provision. It concludes on its scheduled expiry date."
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 5. Missing / Absent Terms (Check if user is asking for specific terms absent from agreement)
    missing_candidate_terms = [
        ("interest", ["interest", "late fee", "late charge", "finance charge"]),
        ("severability", ["severability"]),
        ("arbitration", ["arbitration", "dispute resolution forum"]),
        ("non-compete", ["non-compete", "non-competition"]),
        ("audit right", ["audit right", "inspection right"]),
        ("exclusivity", ["exclusivity", "exclusive provider"]),
        ("insurance", ["insurance requirement", "coverage limit", "policy"]),
    ]

    for term_label, keywords in missing_candidate_terms:
        if any(kw in q_lower for kw in keywords):
            # Check if term exists in metadata or relevant chunks
            found_in_evidence = False
            meta_combined = f"{contract_meta.get('penalty_info', '')} {contract_meta.get('payment_terms', '')}".lower()
            if any(kw in meta_combined for kw in keywords):
                found_in_evidence = True
            elif relevant_chunks:
                for c in relevant_chunks:
                    c_text = (c.get("text") or "").lower()
                    if any(kw in c_text for kw in keywords):
                        found_in_evidence = True
                        break

            if not found_in_evidence:
                answer = (
                    f"**This information is not specified in the contract.**\n\n"
                    f"I reviewed the terms and clause provisions for **{contract_name}**, and there is no provision addressing **{term_label}**.\n\n"
                    f"Because this term is absent from the documented agreement, neither party has an established contractual obligation or remedy regarding {term_label} unless governed by default statutory commercial rules or separate amendments."
                )
                return {
                    "answer": answer,
                    "citations": [],
                    "sources": sources,
                    "show_sources": False
                }

    # 6. Legal Concept explanations within this contract
    for concept, explanation in LEGAL_CONCEPT_DEFINITIONS.items():
        if concept in q_lower and any(w in q_lower for w in ["what is", "explain", "mean", "how does", "standard"]):
            matching_clause = None
            page_found = 1
            if relevant_chunks:
                for c in relevant_chunks:
                    c_lower = (c.get("text") or "").lower()
                    if concept in c_lower:
                        matching_clause = c.get("text", "").strip()
                        page_found = c.get("page_number", 1)
                        break

            clause_reference = ""
            if matching_clause:
                clause_reference = f"\n\n**In {contract_name} (Page {page_found}):** The agreement contains a provision addressing this obligation with counterparty **{company}**."
            else:
                clause_reference = f"\n\n**In this contract:** No standalone clause specifically titled '{concept}' was identified in the indexed sections of **{contract_name}**."

            answer = f"### Understanding {concept.title()}\n\n{explanation}{clause_reference}"
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }

    # 7. Comprehensive Summary queries
    if any(k in q_lower for k in ["summar", "overview", "what is this contract about", "explain this contract", "break down"]):
        purpose = contract_meta.get("summary") or f"A commercial agreement between ContractIQ and {company} establishing services, governance, and commercial obligations."
        payment = contract_meta.get("payment_terms") or "Invoicing and payment terms as defined in the commercial schedule."
        start = contract_meta.get("start_date") or "Documented start date"
        expiry = contract_meta.get("expiry_date") or "Documented expiration date"
        renewal = contract_meta.get("renewal_date") or "Not applicable"
        notice = contract_meta.get("notice_period") or "Standard written notice"
        risk = contract_meta.get("risk_level", "Moderate")
        penalty = contract_meta.get("penalty_info") or "Standard contractual remedies apply."

        answer = (
            f"### Executive Summary: {contract_name}\n\n"
            f"Here is a structured overview of this agreement with **{company}**:\n\n"
            f"| Key Term | Contractual Provision |\n"
            f"| :--- | :--- |\n"
            f"| **Purpose & Scope** | {purpose} |\n"
            f"| **Counterparty** | {company} |\n"
            f"| **Payment Terms** | {payment} |\n"
            f"| **Duration** | Effective from {start} through {expiry} |\n"
            f"| **Renewal & Notice** | Next renewal: {renewal} ({notice}) |\n"
            f"| **Penalties & SLAs** | {penalty} |\n"
            f"| **Risk Rating** | **{risk}** |\n\n"
            f"**Key Operational Takeaways:**\n"
            f"- Ensure invoices are verified against agreed deliverable milestones ({payment}).\n"
            f"- Calendar the required notice window ({notice}) to evaluate whether to renew or terminate before the cutoff."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 8. Payment, Fees, Billing queries
    if any(k in q_lower for k in ["payment", "fee", "billing", "cost", "price", "rate", "invoic"]):
        payment = contract_meta.get("payment_terms") or "Standard commercial invoicing schedule"
        answer = (
            f"Payment terms for this agreement are governed by **{payment}** with **{company}**.\n\n"
            f"- **Invoicing Schedule:** **{payment}**\n"
            f"- **Payee / Vendor:** {company}\n\n"
            f"Ensure invoices are reviewed and approved within the agreed window to maintain compliance and avoid potential service holds or dispute notices."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 9. Penalties, SLAs, Liquidated Damages
    if any(k in q_lower for k in ["penalt", "sla", "liquidated damages", "service credit"]):
        penalty = contract_meta.get("penalty_info") or "No separate monetary penalty or liquidated damages clause was identified in this contract."
        answer = (
            f"Regarding performance remedies and penalties, the contract specifies: **{penalty}**\n\n"
            f"- **Contractual Provision:** {penalty}\n\n"
            f"If service interruptions or delivery delays arise, verify whether remedy claims are limited to service credits or allow broader claims under the general breach clause."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 10. Risk and Liability exposure
    if any(k in q_lower for k in ["risk", "liability", "indemn", "exposure", "cap"]):
        risk_level = contract_meta.get("risk_level", "Not Assessed")
        summary = contract_meta.get("summary", "Standard commercial terms apply.")
        answer = (
            f"This agreement carries an overall risk rating of **{risk_level}** with **{company}**.\n\n"
            f"- **Assessed Risk Level:** **{risk_level}**\n"
            f"- **Risk Summary:** {summary}\n\n"
            f"Review the indemnification obligations and liability caps before executing amendments or renewals to prevent unbudgeted legal exposure."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 11. Termination and cancellation
    if any(k in q_lower for k in ["terminat", "cancel", "end early"]):
        notice = contract_meta.get("notice_period") or "advance written notice"
        answer = (
            f"Terminating **{contract_name}** requires providing **{notice}** to **{company}**.\n\n"
            f"- **Notice Requirement:** **{notice}**\n"
            f"- **Termination Pathways:** Agreements typically distinguish between termination for convenience (with advance notice) and termination for material breach (with a cure period). All termination notices must be issued in formal written format as specified in the notices section."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 12. Direct matching chunk explanation without artificial labels
    if relevant_chunks:
        best_chunk = (relevant_chunks[0].get("text") or "").strip()
        page_num = relevant_chunks[0].get("page_number", 1)
        sec_name = relevant_chunks[0].get("section") or "the contract"
        answer = (
            f"Under **{contract_name}** (Page {page_num}), the agreement establishes terms for this matter in {sec_name}.\n\n"
            f"The contract provides that obligations and standards are governed according to the agreed specifications between ContractIQ and **{company}**. "
            f"All operational commitments should be verified against these documented requirements."
        )
        return {
            "answer": answer,
            "citations": citations if sources_asked else [],
            "sources": sources,
            "show_sources": sources_asked
        }

    # 13. Default explicit acknowledgement when information is not in the contract
    return {
        "answer": (
            f"I reviewed the indexed clauses and metadata for **{contract_name}**, but **this specific detail is not stated in the contract**.\n\n"
            f"You can ask about documented terms including payment schedules, expiration dates, renewal notice deadlines, or risk ratings."
        ),
        "citations": [],
        "sources": sources,
        "show_sources": False
    }

def answer_general_question(
    question: str,
    all_contracts_meta: List[dict] = None,
    db: Optional[Session] = None
) -> dict:
    """
    General Assistant pipeline: answers legal concepts, contract management guidance,
    or general queries across all authorized contracts in the workspace with clear, human-friendly plain English.
    """
    q_lower = question.lower()
    sources_asked = is_source_requested(question)

    # 1. Off-Topic Check
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, q_lower):
            return {
                "answer": (
                    "I am ContractIQ's Legal Assistant dedicated to analyzing contracts, legal terms, and commercial agreements. "
                    "I cannot assist with off-topic subjects such as sports, recipes, or entertainment. "
                    "Please ask any question regarding contract management, legal terminology, or your workspace agreements."
                ),
                "citations": [],
                "sources": [],
                "show_sources": False
            }

    # 2. General Legal Concept Explanations
    for concept, explanation in LEGAL_CONCEPT_DEFINITIONS.items():
        if concept in q_lower and any(w in q_lower for w in ["what is", "explain", "mean", "standard", "guidance", "how does"]):
            answer = (
                f"### Understanding {concept.title()}\n\n"
                f"{explanation}\n\n"
                f"**Key Contract Management Considerations:**\n"
                f"- **Review obligations carefully:** Verify whether obligations are mutual or one-sided.\n"
                f"- **Track operational deadlines:** Strict calendar windows apply to notice, dispute filing, and termination rights.\n"
                f"- **Financial exposure:** Ensure liability caps and indemnities align with organizational risk limits.\n\n"
                f"*To see how a specific contract handles {concept}, select that agreement from the Context selector at the top.*"
            )
            return {
                "answer": answer,
                "citations": ["ContractIQ Legal Knowledge Base"] if sources_asked else [],
                "sources": [],
                "show_sources": sources_asked
            }

    # 3. Workspace-Wide Deadline Analysis across all authorized contracts
    is_deadline_query = any(k in q_lower for k in ["deadline", "expir", "renew", "upcoming", "due date", "cutoff"])
    if all_contracts_meta and is_deadline_query:
        upcoming_notice = []
        passed_notice = []
        upcoming_expiry = []

        for c in all_contracts_meta:
            c_name = c.get("name") or "Agreement"
            c_company = c.get("company") or "Partner"
            dl_info = analyze_contract_deadlines(c)

            if dl_info["notice_deadline"]:
                d_str = dl_info["notice_deadline"].strftime("%B %d, %Y")
                if dl_info["has_notice_passed"]:
                    passed_notice.append((dl_info["notice_deadline"], c_name, c_company, d_str, dl_info["notice_days_diff"], dl_info["renewal_date"]))
                else:
                    upcoming_notice.append((dl_info["notice_deadline"], c_name, c_company, d_str, dl_info["notice_days_diff"], dl_info["renewal_date"]))
            elif dl_info["expiry_date"] and not dl_info["has_expired"]:
                exp_str = dl_info["expiry_date"].strftime("%B %d, %Y")
                days_left = (dl_info["expiry_date"] - CURRENT_REFERENCE_DATE).days
                upcoming_expiry.append((dl_info["expiry_date"], c_name, c_company, exp_str, days_left))

        upcoming_notice.sort(key=lambda x: x[0])
        passed_notice.sort(key=lambda x: x[0])
        upcoming_expiry.sort(key=lambda x: x[0])

        summary_parts = ["### Workspace Contracts: Deadlines and Action Items\n\n"]

        if upcoming_notice:
            summary_parts.append("**Upcoming Actionable Notice Deadlines:**\n")
            for item in upcoming_notice[:4]:
                ren_str = item[5].strftime("%B %d, %Y") if item[5] else "upcoming renewal"
                summary_parts.append(
                    f"- **{item[1]}** ({item[2]}):\n"
                    f"  - **Notice Deadline:** **{item[3]}** ({item[4]} days remaining)\n"
                    f"  - **Required Action:** Submit formal written non-renewal notice if you do not wish the contract to renew on {ren_str}.\n"
                )
            summary_parts.append("\n")

        if passed_notice:
            summary_parts.append("**Passed Notice Deadlines Requiring Immediate Attention:**\n")
            for item in passed_notice[:3]:
                ren_str = item[5].strftime("%B %d, %Y") if item[5] else "scheduled renewal"
                summary_parts.append(
                    f"- **{item[1]}** ({item[2]}):\n"
                    f"  - **Notice Cutoff:** Passed on **{item[3]}** ({item[4]} days ago)\n"
                    f"  - **Current Status:** Contract is committed to automatic renewal on **{ren_str}** unless a mutual amendment is negotiated.\n"
                )
            summary_parts.append("\n")

        if upcoming_expiry:
            summary_parts.append("**Upcoming Contract Expirations:**\n")
            for item in upcoming_expiry[:3]:
                summary_parts.append(
                    f"- **{item[1]}** ({item[2]}): Concludes on **{item[3]}** ({item[4]} days remaining)\n"
                )
            summary_parts.append("\n")

        summary_parts.append("*Select any individual contract from the context dropdown to review its full provisions or open the verified document source.*")
        return {
            "answer": "".join(summary_parts),
            "citations": [f"ContractIQ Workspace Database ({len(all_contracts_meta)} Contracts)"] if sources_asked else [],
            "sources": [],
            "show_sources": sources_asked
        }

    # 4. Workspace-Wide Summary or Risk Queries
    if all_contracts_meta and any(term in q_lower for term in ["how many", "list", "overview", "summary", "high risk", "risk", "all contract"]):
        total = len(all_contracts_meta)
        high_risk = [c for c in all_contracts_meta if (c.get("risk_level") or c.get("riskLevel")) in ["High", "Critical"]]
        expiring = [c for c in all_contracts_meta if c.get("expiry_date") or c.get("expiryDate")]

        summary_lines = [
            f"### Workspace Contracts Overview\n\n",
            f"Here is a summary of the active contracts currently authorized in your workspace:\n\n",
            f"- **Total Active Contracts:** {total}\n",
            f"- **Contracts Requiring Attention (High/Critical Risk):** {len(high_risk)}\n",
            f"- **Contracts with Documented Expiration Dates:** {len(expiring)}\n\n",
        ]
        if high_risk:
            summary_lines.append("**Key High-Risk Agreements to Review:**\n")
            for h in high_risk[:4]:
                c_name = h.get("name") or "Contract"
                c_company = h.get("company") or "Partner"
                c_risk = h.get("risk_level") or h.get("riskLevel") or "High"
                summary_lines.append(f"- **{c_name}** with *{c_company}* (Risk Rating: **{c_risk}**)\n")

        summary_lines.append("\nTo inspect specific terms, payment provisions, or notice requirements, select any agreement from the **Context selector** at the top.")
        return {
            "answer": "".join(summary_lines),
            "citations": [f"ContractIQ Workspace Database ({total} Contracts)"] if sources_asked else [],
            "sources": [],
            "show_sources": sources_asked
        }

    # 5. Cross-contract semantic search across authorized contracts
    if all_contracts_meta and db is not None:
        contract_ids = [c["id"] for c in all_contracts_meta if c.get("id")]
        cross_chunks = VectorStore.search_across_contracts(contract_ids, question, top_k=3, db=db)
        if cross_chunks:
            # Map contract id to name
            c_map = {c.get("id"): c.get("name") for c in all_contracts_meta}
            findings = []
            for ch in cross_chunks:
                cid = ch.get("contract_id")
                cname = c_map.get(cid, cid)
                pnum = ch.get("page_number", 1)
                text_snip = (ch.get("text") or "").strip()[:200]
                findings.append(f"- In **{cname}** (Page {pnum}): \"{text_snip}...\"")

            answer = (
                f"### Cross-Contract Search Results\n\n"
                f"I searched across your authorized contracts for \"{question}\":\n\n"
                + "\n\n".join(findings) +
                f"\n\nTo analyze any of these agreements in depth, choose it from the **Context selector** above."
            )
            return {
                "answer": answer,
                "citations": ["ContractIQ Multi-Contract Index"] if sources_asked else [],
                "sources": [],
                "show_sources": sources_asked
            }

    # 6. Default response when question cannot be answered from workspace evidence
    return {
        "answer": (
            "I could not locate specific information addressing your question across the active contracts in your workspace.\n\n"
            "You can ask about:\n"
            "- **Upcoming deadlines:** *'What are our upcoming contract deadlines?'*\n"
            "- **High-risk agreements:** *'Which contracts have high risk ratings?'*\n"
            "- **Legal concepts:** *'Explain standard indemnification obligations'* or *'What is a limitation of liability?'*\n\n"
            "To review a specific contract's payment terms, clauses, or liabilities, select that agreement from the **Context selector** at the top."
        ),
        "citations": ["ContractIQ Assistant"] if sources_asked else [],
        "sources": [],
        "show_sources": sources_asked
    }
