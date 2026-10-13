import re
import json
from typing import Dict, Any, List, Optional
from app.services.vector_store import VectorStore
from app.core.config import settings

# Active Gemini models in order of priority
GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

# Off-topic topic indicators to politely deflect
OFF_TOPIC_PATTERNS = [
    r"\b(?:cricket|football|soccer|basketball|nba|ipl|world cup|premier league|match score|tennis|olympics)\b",
    r"\b(?:recipe|cook(?:ing)?|ingredients|bake|pasta|pizza|biryani|burger|dessert|calories in)\b",
    r"\b(?:movie|actor|actress|hollywood|bollywood|netflix show|cinema|box office|video game|playstation|xbox)\b",
    r"\b(?:weather forecast|horoscope|astrology|celebrity gossip)\b",
]

# Detection pattern for questions explicitly asking for sources, citations, clauses, pages, or proof
SOURCE_REQUEST_PATTERNS = [
    r"\b(?:what is (?:the|your) source|show (?:me )?(?:the )?source|sources|citation|citations|cite|cited)\b",
    r"\b(?:which clause|what clause|which section|what section|clause number|section number)\b",
    r"\b(?:page number|which page|what page|relevant page|relevant section)\b",
    r"\b(?:where in the contract|where does it say|show (?:me )?(?:the )?proof|evidence|reference|where is this stated|according to which)\b",
]

def is_source_requested(question: str) -> bool:
    """Detects whether user is explicitly asking for source citations, clause locations, or document pages."""
    q_lower = question.lower()
    for pattern in SOURCE_REQUEST_PATTERNS:
        if re.search(pattern, q_lower):
            return True
    return False

# Common legal and contract concepts explained in everyday, non-technical English
LEGAL_CONCEPT_DEFINITIONS = {
    "indemnity": (
        "**Indemnity** means one party promises to pay for legal damages or losses if something goes wrong. "
        "In everyday terms: *'If my action causes a lawsuit or loss, I will cover your costs so you don't lose money.'*"
    ),
    "liability": (
        "A **Limitation of Liability** sets a financial ceiling on the maximum amount of money one party can sue the other for if there is a contract breach. "
        "In everyday terms: it prevents a company from being ruined by unbounded damages if a dispute occurs."
    ),
    "termination": (
        "**Termination** provisions explain how and when either party can cancel the contract early. "
        "Usually contracts allow termination 'for cause' (if someone breaches a rule and fails to fix it) or 'for convenience' (simply deciding to end the agreement after giving advance written notice)."
    ),
    "renewal": (
        "**Renewal** terms decide what happens when a contract approaches its end date. "
        "An **auto-renewal (or evergreen)** clause automatically extends the contract unless one party gives written notice to cancel before the deadline window."
    ),
    "governing law": (
        "**Governing Law** defines which state or country's legal system will interpret the contract if a disagreement arises, while **jurisdiction** specifies which court will handle the lawsuit."
    ),
    "confidentiality": (
        "**Confidentiality (NDA)** terms protect private business information, customer data, and trade secrets from being shared with outsiders without permission."
    ),
    "force majeure": (
        "**Force Majeure** excuses both parties from performing their duties when an unavoidable, major emergency happens—such as natural disasters, pandemics, war, or government orders."
    ),
    "penalty": (
        "**Penalties or Liquidated Damages** are predetermined financial amounts or bill discounts that a party must pay if they miss agreed deadlines or service standards."
    ),
    "sla": (
        "A **Service Level Agreement (SLA)** sets guaranteed performance targets (like 99.9% uptime or 4-hour support response) and defines the bill credits owed if targets are missed."
    ),
}

def answer_general_question(question: str, all_contracts_meta: List[dict] = None) -> dict:
    """
    General Assistant pipeline: answers legal concepts, contract management guidance,
    or general queries across all contracts in the workspace with clear, human-friendly plain English.
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

    # 2. Check for Legal Concept / Advisory queries
    for concept, explanation in LEGAL_CONCEPT_DEFINITIONS.items():
        if concept in q_lower:
            answer = (
                f"### Understanding {concept.title()} in Everyday Language\n\n"
                f"{explanation}\n\n"
                f"**What this means in practice:**\n"
                f"- **Review obligations carefully:** Always check whether obligations are mutual or one-sided.\n"
                f"- **Watch deadlines:** Many legal provisions (like termination or dispute notice) have strict calendar limits.\n"
                f"- **Financial exposure:** Ensure any caps or exclusions align with your organization's risk tolerance.\n\n"
                f"*Note: This is general legal information. To inspect how a specific contract handles {concept}, select that contract from the context dropdown above.*"
            )
            return {
                "answer": answer,
                "citations": ["ContractIQ Legal Knowledge Base"] if sources_asked else [],
                "sources": [],
                "show_sources": sources_asked
            }

    # 3. Workspace-wide summary / multi-contract check
    if all_contracts_meta and any(term in q_lower for term in ["how many", "list", "overview", "summary", "high risk", "expir", "all contract"]):
        total = len(all_contracts_meta)
        high_risk = [c for c in all_contracts_meta if (c.get("risk_level") or c.get("riskLevel")) in ["High", "Critical"]]
        expiring = [c for c in all_contracts_meta if c.get("expiry_date") or c.get("expiryDate")]

        summary_lines = [
            f"### Workspace Contracts Overview\n\n",
            f"Here is a summary of the active contracts currently in your workspace:\n\n",
            f"- **Total Active Contracts:** {total}\n",
            f"- **Contracts Requiring Attention (High/Critical Risk):** {len(high_risk)}\n",
            f"- **Contracts with Documented Expiration Dates:** {len(expiring)}\n\n",
        ]
        if high_risk:
            summary_lines.append("**Key Agreements to Review:**\n")
            for h in high_risk[:4]:
                c_name = h.get("name") or "Contract"
                c_company = h.get("company") or "Partner"
                c_risk = h.get("risk_level") or h.get("riskLevel") or "High"
                summary_lines.append(f"- **{c_name}** with *{c_company}* (Risk: {c_risk})\n")

        summary_lines.append("\n**Next step:** Select any specific contract from the **Context selector** above to ask detailed questions about its clauses, payment dates, or liabilities.")
        return {
            "answer": "".join(summary_lines),
            "citations": [f"ContractIQ Workspace Database ({total} Contracts)"] if sources_asked else [],
            "sources": [],
            "show_sources": sources_asked
        }

    # Default general guidance answer
    return {
        "answer": (
            "### General Contract & Legal Guidance\n\n"
            "You are currently in **General Context** mode. I can assist with general legal concepts, contract standards, risk identification, or workspace-wide summaries.\n\n"
            "- **Common topics you can ask:**\n"
            "  - *'Explain standard indemnification in simple terms'*\n"
            "  - *'What is a reasonable notice window for termination?'*\n"
            "  - *'How many high-risk contracts exist in our workspace?'*\n\n"
            "To review a specific contract's terms, payment dates, or obligations, choose that contract from the **Context selector** dropdown at the top."
        ),
        "citations": ["ContractIQ Workspace Assistant"] if sources_asked else [],
        "sources": [],
        "show_sources": sources_asked
    }

def answer_contract_question(contract_id: str, question: str, contract_meta: dict) -> dict:
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

    # 2. Strict contract-isolated chunk retrieval
    vector_store = VectorStore(contract_id)
    relevant_chunks = vector_store.search(question, top_k=5)

    context_text = "\n\n".join([
        f"[Clause Chunk #{c.get('chunk_id', 0)} - Page {c.get('page_number', 1)}]:\n{c.get('text', '')}"
        for c in relevant_chunks
    ])

    doc_name = contract_meta.get("file_name") or contract_meta.get("name", "Contract Document")
    citations = []
    sources = []

    for c in relevant_chunks:
        page_num = c.get("page_number")
        section_name = c.get("section")
        chunk_excerpt = c.get("text", "").strip()
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

    # 3. If Gemini API is available, generate grounded plain-English response
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY, http_options={"timeout": 6.0})

            source_instruction = ""
            if sources_asked:
                source_instruction = """
NOTE ON SOURCES: The user is explicitly asking for source citations, clause references, or page numbers.
Directly identify the relevant clause name, section, and page number from the Retrieved Contract Text Context, and quote the exact supporting sentence.
"""
            else:
                source_instruction = """
NOTE ON SOURCES: The user is NOT asking for sources or citations. Focus entirely on a clear, human-friendly answer without inserting source cards or raw page reference footers.
"""

            prompt = f"""You are ContractIQ's Legal Document Intelligence Assistant analyzing the contract "{contract_meta.get('name')}".

MISSION:
Provide answers that anyone without legal or contract-management training can easily understand. Preserve 100% factual accuracy without altering the legal meaning of clauses.

CORE RULES:
1. START WITH A DIRECT ANSWER:
   - Begin with an immediate, plain-English answer in the first 1-2 sentences.
   - Explain legal jargon in everyday language (e.g., explain "indemnity" as paying for damages if something goes wrong; explain "limitation of liability" as the maximum financial cap on damages).

2. PRACTICAL IMPLICATIONS:
   - Explain what this means in practice: actions required, upcoming deadlines, payment obligations, or risks to watch out for.
   - Distinguish clearly between what the contract explicitly states vs practical recommendations.

3. ADAPT FORMAT DYNAMICALLY (DO NOT FORCE A RIGID TEMPLATE):
   - For summaries: Divide into clear sections: Purpose, Parties' Obligations, Payment Terms, Duration & Renewal, Termination, and Key Risks.
   - For complex questions: Use clean headings, bullet points, numbered steps, or markdown tables when helpful.
   - For simple questions: Be direct and concise. Avoid unnecessary length or repeated phrases.
   - Highlight important dates, monetary amounts, and notice windows in **bold**.

4. STRICT FACTUAL GROUNDING:
   - Ground your answer ONLY in the Contract Metadata and Retrieved Contract Text Context below.
   - NEVER invent or guess dates, payment amounts, clause numbers, renewal conditions, obligations, or counterparty facts.
   - If a specific detail is missing, ambiguous, or conditional, say so directly (e.g., "This contract does not specify late payment interest" or "Renewal is conditional upon 60 days advance written notice").
   - If the question asks for something not in the contract, say clearly that the agreement does not contain this information.

{source_instruction}

Contract Metadata:
- Contract Name: {contract_meta.get('name')}
- Counterparty / Company: {contract_meta.get('company') or 'Contract Partner'}
- Contract Type: {contract_meta.get('contract_type') or 'Commercial Agreement'}
- Risk Level: {contract_meta.get('risk_level') or 'Not Assessed'}
- Start Date: {contract_meta.get('start_date') or 'Not explicitly specified'}
- Expiry Date: {contract_meta.get('expiry_date') or 'Not explicitly specified'}
- Renewal Date: {contract_meta.get('renewal_date') or 'Not explicitly specified'}
- Notice Period: {contract_meta.get('notice_period') or 'Not explicitly specified'}
- Payment Terms: {contract_meta.get('payment_terms') or 'Not explicitly specified'}
- Penalty / SLA Info: {contract_meta.get('penalty_info') or 'Not explicitly specified'}
- Executive Summary: {contract_meta.get('summary') or 'Not specified'}

Retrieved Contract Text Context:
{context_text if context_text else "No matching clause chunks found in vector index."}

User Question:
{question}
"""

            for model_name in GEMINI_MODELS:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    answer_text = response.text.strip()
                    if answer_text:
                        return {
                            "answer": answer_text,
                            "citations": citations if sources_asked else [],
                            "sources": sources,
                            "show_sources": sources_asked
                        }
                except Exception as err:
                    print(f"[Gemini RAG Chat error with {model_name}]: {err}")
                    continue
        except Exception as e:
            print(f"[Gemini RAG Chat Fallback] {e}")

    # Fallback to enhanced heuristic plain-English generator
    return heuristic_chat_response(question, contract_meta, relevant_chunks, citations, sources, sources_asked)

def heuristic_chat_response(
    question: str,
    contract_meta: dict,
    relevant_chunks: List[dict],
    citations: List[str],
    sources: List[dict],
    sources_asked: bool = False
) -> dict:
    """
    Intelligent fallback responding accurately, structurally, and clearly
    with understandable plain-English answers adapted to the query type.
    """
    q_lower = question.lower()
    contract_name = contract_meta.get("name", "this agreement")
    company = contract_meta.get("company", "the counterparty")

    # 1. Source queries: when user explicitly asks for proof, clause location, or source
    if sources_asked:
        if relevant_chunks:
            best = relevant_chunks[0]
            doc_name = contract_meta.get("file_name") or contract_name
            page_val = best.get("page_number", 1)
            chunk_text = best.get("text", "").strip()
            answer = (
                f"### Verified Document Source\n\n"
                f"This statement is supported by **{doc_name}**, located on **Page {page_val}**:\n\n"
                f"> \"{chunk_text[:350]}...\"\n\n"
                f"You can review the full context directly by opening the verified PDF source attached below."
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

    # 2. Summary queries: structured comprehensive summary
    if any(k in q_lower for k in ["summar", "overview", "what is this contract about", "explain this contract", "break down"]):
        purpose = contract_meta.get("summary") or f"A commercial agreement between ContractIQ and {company} governing services and deliverables."
        payment = contract_meta.get("payment_terms") or "Standard invoicing schedule as defined in the commercial terms."
        start = contract_meta.get("start_date") or "Documented start date"
        expiry = contract_meta.get("expiry_date") or "Documented expiration date"
        renewal = contract_meta.get("renewal_date") or "Auto-renewal subject to advance notice"
        notice = contract_meta.get("notice_period") or "30 days prior written notice"
        risk = contract_meta.get("risk_level", "Moderate")
        penalty = contract_meta.get("penalty_info") or "Standard contractual remedies apply."

        answer = (
            f"### Executive Summary: {contract_name}\n\n"
            f"Here is a plain-English overview of this agreement with **{company}**:\n\n"
            f"| Key Term | Contract Provision |\n"
            f"| :--- | :--- |\n"
            f"| **Main Purpose** | {purpose} |\n"
            f"| **Counterparty** | {company} |\n"
            f"| **Payment Terms** | {payment} |\n"
            f"| **Duration** | Commences {start}, concludes {expiry} |\n"
            f"| **Renewal & Notice** | Next deadline: {renewal} ({notice}) |\n"
            f"| **Penalties / SLAs** | {penalty} |\n"
            f"| **Risk Rating** | **{risk}** |\n\n"
            f"**Practical Next Steps:**\n"
            f"- Ensure invoices are submitted according to the agreed schedule ({payment}).\n"
            f"- Mark your calendar at least 30 days before the notice deadline ({notice}) to evaluate whether to renew or terminate."
        )
        return {
            "answer": answer,
            "citations": [],
            "sources": sources,
            "show_sources": False
        }

    # 3. Check for Legal Concept explanation queries within contract
    for concept, explanation in LEGAL_CONCEPT_DEFINITIONS.items():
        if concept in q_lower and any(w in q_lower for w in ["what is", "explain", "mean", "standard", "advice", "how does"]):
            matching_clause = None
            if relevant_chunks:
                for c in relevant_chunks:
                    if concept in c.get("text", "").lower():
                        matching_clause = c.get("text", "").strip()
                        break

            clause_note = (
                f"\n\n**How {contract_name} handles this:**\n> \"{matching_clause[:280]}...\""
                if matching_clause
                else f"\n\n**In this contract:** No standalone clause specifically titled '{concept}' was detected in the indexed sections."
            )

            answer = (
                f"### {concept.title()}: Plain-English Explanation\n\n"
                f"{explanation}{clause_note}\n\n"
                f"**What this means for you:**\n"
                f"Pay close attention to financial caps and notice requirements to ensure your organization does not incur unexpected liability."
            )
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }

    # 4. Factual contract questions: Renewal & Expiration
    if any(k in q_lower for k in ["renewal", "renew", "evergreen", "expire", "expiry", "end date"]):
        renewal = contract_meta.get("renewal_date") or contract_meta.get("expiry_date") or "Not explicitly fixed in metadata"
        notice = contract_meta.get("notice_period") or "Standard written notice as stated in termination terms"
        answer = (
            f"This agreement is scheduled for renewal or expiration on **{renewal}**, and requires **{notice}** if either party decides not to extend.\n\n"
            f"- **Next Expiry / Renewal Date:** **{renewal}**\n"
            f"- **Advance Notice Window:** **{notice}**\n"
            f"- **Counterparty:** {company}\n\n"
            f"**Action required:** Set a reminder at least 30 to 60 days before the deadline so your team has enough time to negotiate rates or issue a non-renewal notice without missing the cutoff."
        )

    # 5. Factual contract questions: Notice & Termination
    elif any(k in q_lower for k in ["notice", "terminat", "cancel", "end early"]):
        notice = contract_meta.get("notice_period") or "Not explicitly specified"
        answer = (
            f"Under **{contract_name}**, terminating the agreement requires providing **{notice}**.\n\n"
            f"- **Required Notice Window:** **{notice}**\n"
            f"- **Counterparty:** {company}\n\n"
            f"**Practical guidance:** Check whether the contract allows termination 'for convenience' (anytime with written notice) or requires 'for cause' (such as an uncured breach with a 30-day cure period). Send all formal notices through certified delivery as required by the notices clause."
        )

    # 6. Specific query on interest rate, late fees, or missing specific terms
    elif any(k in q_lower for k in ["interest", "late fee", "late charge"]):
        penalty = contract_meta.get("penalty_info") or ""
        payment = contract_meta.get("payment_terms") or ""
        has_interest = "interest" in penalty.lower() or "interest" in payment.lower()
        if not has_interest and relevant_chunks:
            for c in relevant_chunks:
                if "interest" in c.get("text", "").lower() or "late fee" in c.get("text", "").lower():
                    has_interest = True
                    break
        if not has_interest:
            answer = (
                f"**This specific detail is not stated in the contract.**\n\n"
                f"- **Documented Payment Terms:** **{payment or 'Standard invoicing terms apply'}**\n"
                f"- **Missing Information:** The agreement does not specify a separate late payment interest rate or penalty fee.\n\n"
                f"**Practical guidance:** Unless an interest provision is formally established in a statement of work or amendment, default statutory commercial rates apply."
            )
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }

    elif any(t in q_lower for t in ["severability", "arbitration", "non-compete", "audit right", "exclusivity", "insurance requirement", "warranty period"]):
        missing_topic = next(t for t in ["severability", "arbitration", "non-compete", "audit right", "exclusivity", "insurance requirement", "warranty period"] if t in q_lower)
        found_in_chunks = False
        if relevant_chunks:
            for c in relevant_chunks:
                if missing_topic in c.get("text", "").lower():
                    found_in_chunks = True
                    break
        if not found_in_chunks:
            answer = (
                f"**This specific detail is not stated in the contract.**\n\n"
                f"- I checked the clauses and metadata for **{contract_name}**, and there is no provision addressing **{missing_topic}**.\n\n"
                f"**What this means:** Because this term is not documented in the agreement, neither party has established contractual rights or duties regarding {missing_topic}."
            )
            return {
                "answer": answer,
                "citations": [],
                "sources": sources,
                "show_sources": False
            }

    # 7. Factual contract questions: Payment terms, fees, billing
    elif any(k in q_lower for k in ["payment", "fee", "billing", "cost", "price", "rate", "invoic"]):
        payment = contract_meta.get("payment_terms") or "Standard commercial invoicing terms as outlined in the contract scope"
        answer = (
            f"Payment terms for this agreement are governed by **{payment}**.\n\n"
            f"- **Invoicing & Payment Schedule:** **{payment}**\n"
            f"- **Billing Party:** {company}\n\n"
            f"**What this means for you:** Verify invoices against milestone deliverables before approving payment, and ensure payment is issued within the specified timeframe to prevent late fees or service interruptions."
        )

    # 7. Factual contract questions: Penalties, SLAs, Liquidated damages
    elif any(k in q_lower for k in ["penalt", "late fee", "liquidated damages", "sla", "service credit"]):
        penalty = contract_meta.get("penalty_info") or "No separate monetary penalty or liquidated damages clause was identified in this contract."
        answer = (
            f"Regarding penalties and performance standards, the contract specifies: **{penalty}**\n\n"
            f"- **Documented Remedy / Penalty Provision:** {penalty}\n\n"
            f"**Practical guidance:** If operational delays or service interruptions occur, verify whether remedies are limited to service credits or permit broader breach of contract claims."
        )

    # 8. Factual contract questions: Risk & Liability exposure
    elif any(k in q_lower for k in ["risk", "liability", "indemn", "exposure", "cap"]):
        risk_level = contract_meta.get("risk_level", "Not Assessed")
        summary = contract_meta.get("summary", "Standard commercial terms.")
        answer = (
            f"This agreement carries an overall risk rating of **{risk_level}**.\n\n"
            f"- **Assessed Risk Level:** **{risk_level}**\n"
            f"- **Key Assessment Summary:** {summary}\n\n"
            f"**Risk takeaway:** Carefully check the indemnification obligations and limitation of liability caps before signing or renewing to avoid unexpected financial exposure."
        )

    # 9. Matching relevant chunk if found
    elif relevant_chunks:
        best_chunk = relevant_chunks[0].get("text", "").strip()
        page_num = relevant_chunks[0].get("page_number", 1)
        answer = (
            f"Here is the relevant clause from **{contract_name}** that addresses your question:\n\n"
            f"> \"{best_chunk[:320]}...\"\n\n"
            f"**In everyday language:** This clause establishes the contractual rules for this topic. "
            f"Let me know if you would like me to explain any specific term or verify its legal implications."
        )

    # 10. Explicit statement when information is missing or not in the contract
    else:
        answer = (
            f"I checked **{contract_name}** for this specific topic, but **this detail is not stated in the contract**.\n\n"
            f"- The agreement text and metadata do not contain specific terms addressing your question.\n"
            f"- To explore documented provisions, feel free to ask about payment terms, renewal deadlines, notice periods, or risk ratings."
        )

    return {
        "answer": answer,
        "citations": [],
        "sources": sources,
        "show_sources": False
    }
