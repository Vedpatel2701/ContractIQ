import re
from typing import Dict, Any, List
from app.services.vector_store import VectorStore
from app.core.config import settings

# Active Gemini models in order of priority
GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
]

# Off-topic topic indicators to politely deflect
OFF_TOPIC_PATTERNS = [
    r"\b(?:cricket|football|soccer|basketball|nba|ipl|world cup|premier league|match score|tennis|olympics)\b",
    r"\b(?:recipe|cook(?:ing)?|ingredients|bake|pasta|pizza|biryani|burger|dessert|calories in)\b",
    r"\b(?:movie|actor|actress|hollywood|bollywood|netflix show|cinema|box office|video game|playstation|xbox)\b",
    r"\b(?:weather forecast|horoscope|astrology|celebrity gossip)\b",
]

# Common legal and contract concepts for offline explanation & matching
LEGAL_CONCEPT_DEFINITIONS = {
    "indemnity": "An indemnification clause is a contractual commitment where one party agrees to compensate the other for specified losses, damages, or legal liabilities arising from breaches, third-party claims, or operational faults.",
    "liability": "Limitation of liability clauses set the maximum financial ceiling or exclude certain types of damages (such as indirect, punitive, or consequential damages) that one party can recover from the other in the event of a breach.",
    "termination": "Termination clauses govern the rights, notice requirements, cure periods, and conditions under which either party can end the agreement before its scheduled expiration.",
    "renewal": "Renewal provisions determine whether a contract automatically extends (auto-renewal / evergreen) or requires affirmative written notice, along with associated notice deadlines.",
    "governing law": "The governing law clause specifies which state or national jurisdiction's legal principles will interpret and enforce the contract, whereas jurisdiction defines which court or arbitration forum hears disputes.",
    "confidentiality": "Confidentiality or NDA provisions define what non-public proprietary data is protected, standard of care, permitted disclosures, and the duration of secrecy obligations.",
    "force majeure": "A force majeure clause excuses performance obligations when unforeseen, unavoidable external events (natural disasters, war, pandemics, government mandates) prevent compliance.",
    "penalty": "Penalty or liquidated damages provisions outline predetermined monetary assessments or service credits owed when contractual milestones or SLAs are missed.",
    "sla": "Service Level Agreements (SLAs) establish specific technical performance standards (such as 99.9% uptime, response times) and define the service credits or remedies for failure to meet them.",
}

def answer_contract_question(contract_id: str, question: str, contract_meta: dict) -> dict:
    """
    RAG Chat pipeline: searches within this contract's vector chunks and provides well-structured,
    detailed answers for contract-specific and contract-adjacent questions, while deflecting off-topic queries.
    """
    vector_store = VectorStore(contract_id)
    relevant_chunks = vector_store.search(question, top_k=5)

    context_text = "\n\n".join([
        f"[Clause Chunk {c.get('chunk_id', 0)} - Page {c.get('page_number', 1)}]:\n{c.get('text', '')}"
        for c in relevant_chunks
    ])

    doc_name = contract_meta.get("file_name") or contract_meta.get("name", "Contract Document")
    citations = []
    for c in relevant_chunks:
        page_str = f"Page {c.get('page_number')}" if c.get('page_number') else "Document Context"
        chunk_excerpt = c.get("text", "").strip()[:180]
        if chunk_excerpt:
            citations.append(f"{doc_name} • {page_str} (Chunk #{c.get('chunk_id', 0)}): \"{chunk_excerpt}...\"")

    # If Gemini API key is configured, use LLM
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""
You are ContractIQ's Legal Document Intelligence Assistant. You are analyzing the specific agreement titled "{contract_meta.get('name')}".

YOUR MISSION:
Provide clear, well-structured, professional, and detailed answers to user questions.

GUIDELINES BY QUERY TYPE:

1. CONTRACT-SPECIFIC FACTUAL QUESTIONS (e.g. dates, parties, payment terms, notice periods, specific clauses, penalties, obligations):
   - Answer directly and thoroughly using the provided Contract Metadata and Retrieved Document Context.
   - Use structured formatting (bullet points, bold highlights, subheadings where helpful).
   - If a specific sub-detail is not explicitly written in the contract text (e.g. exact late fee percentage), clearly clarify that the contract does not specify that exact value, and highlight the closest related provisions found in the text.

2. CONTRACT-ADJACENT & LEGAL ADVISORY QUESTIONS (e.g. explaining legal terminology, comparing against industry standards, risk analysis, negotiation advice, breach implications, termination checklists):
   - Provide a knowledgeable, well-structured legal explanation of the concept.
   - Then directly relate it back to this uploaded agreement and explain how the contract's actual terms apply.
   - Provide actionable, practical advice for the user's business context.

3. TRULY OFF-TOPIC QUESTIONS (e.g. sports, cooking recipes, weather, celebrity gossip, movies, video games):
   - Politely decline to answer:
     "I am ContractIQ's Legal Document Assistant dedicated to analyzing contracts, legal terms, and commercial agreements. I cannot assist with [topic]. Please feel free to ask any question regarding this agreement, its clauses, obligations, or legal risks."

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
{context_text if context_text else "No matching clause chunks found for this query."}

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
                            "citations": citations
                        }
                except Exception as err:
                    print(f"[Gemini RAG Chat error with {model_name}]: {err}")
                    continue
        except Exception as e:
            print(f"[Gemini RAG Chat Fallback] {e}")

    # Fallback to enhanced heuristic / semantic matcher
    return heuristic_chat_response(question, contract_meta, relevant_chunks, citations)


def heuristic_chat_response(question: str, contract_meta: dict, relevant_chunks: List[dict], citations: List[str]) -> dict:
    """
    Intelligent fallback responding accurately and structurally to contract queries,
    legal concept questions, and off-topic deflections when LLM is offline.
    """
    q_lower = question.lower()

    # 1. Off-Topic Check
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, q_lower):
            return {
                "answer": "I am ContractIQ's Legal Document Assistant dedicated to analyzing contracts, legal terms, and commercial agreements. I cannot assist with off-topic queries like sports, recipes, or entertainment. Please ask any question regarding this contract's terms, clauses, obligations, or risks.",
                "citations": []
            }

    # 2. Check for Legal Concept / Advisory queries
    for concept, explanation in LEGAL_CONCEPT_DEFINITIONS.items():
        if concept in q_lower and ("what is" in q_lower or "explain" in q_lower or "mean" in q_lower or "standard" in q_lower or "advice" in q_lower):
            # Check if we have contract specific chunks
            matching_clause = None
            if relevant_chunks:
                for c in relevant_chunks:
                    if concept in c.get("text", "").lower():
                        matching_clause = c.get("text", "").strip()
                        break

            specific_note = f"\n\n**In this contract:**\n> \"{matching_clause[:300]}...\"" if matching_clause else f"\n\n**In this contract:** No explicit standalone clause specifically addressing '{concept}' was found, though related commercial terms apply."
            
            answer = f"### Legal Context: {concept.title()}\n\n{explanation}{specific_note}"
            return {
                "answer": answer,
                "citations": citations
            }

    # 3. Contract-specific factual matching
    contract_name = contract_meta.get("name", "this agreement")

    if "renewal" in q_lower or "renew" in q_lower or "evergreen" in q_lower or "expire" in q_lower or "expiry" in q_lower:
        renewal = contract_meta.get("renewal_date") or contract_meta.get("expiry_date") or "Not explicitly fixed in metadata"
        notice = contract_meta.get("notice_period") or "Standard contractual notice or as specified in termination terms"
        answer = (
            f"### Contract Renewal & Expiry Details\n\n"
            f"- **Contract:** {contract_name}\n"
            f"- **Renewal / Expiry Date:** {renewal}\n"
            f"- **Notice Period Requirement:** {notice}\n\n"
            f"**Recommendation:** To avoid unintended auto-renewal or contract lapse, initiate review at least 30 to 60 days prior to the renewal date."
        )

    elif "notice" in q_lower or "terminat" in q_lower or "cancel" in q_lower:
        notice = contract_meta.get("notice_period") or "Not explicitly specified"
        answer = (
            f"### Termination Provisions & Notice Requirements\n\n"
            f"- **Notice Period:** {notice}\n"
            f"- **Governing Rule:** Either party wishing to terminate must provide written notice in accordance with the agreed timeframe.\n\n"
            f"Please verify whether termination requires cause (such as material breach with a cure period) or allows convenience."
        )

    elif "payment" in q_lower or "fee" in q_lower or "billing" in q_lower or "cost" in q_lower or "price" in q_lower or "rate" in q_lower:
        payment = contract_meta.get("payment_terms") or "Standard invoicing terms apply as outlined in the contract scope"
        answer = (
            f"### Payment & Billing Terms\n\n"
            f"- **Payment Schedule / Terms:** {payment}\n"
            f"- **Summary:** Ensure invoices are submitted with full itemized documentation according to the counterparty billing guidelines."
        )

    elif "penalt" in q_lower or "late fee" in q_lower or "liquidated damages" in q_lower or "sla" in q_lower:
        penalty = contract_meta.get("penalty_info") or "No separate monetary penalty or liquidated damages clause was detected"
        answer = (
            f"### Penalties, Service Credits & Liquidated Damages\n\n"
            f"- **Provisions Identified:** {penalty}\n\n"
            f"**Operational Context:** If operational delays or SLA shortfalls occur, review whether remedies are limited to service credits or extend to general damages."
        )

    elif "risk" in q_lower or "liability" in q_lower or "indemn" in q_lower or "exposure" in q_lower:
        risk_level = contract_meta.get("risk_level", "Not Assessed")
        summary = contract_meta.get("summary", "")
        answer = (
            f"### Legal & Operational Risk Assessment\n\n"
            f"- **Assessed Risk Level:** **{risk_level}**\n"
            f"- **Summary Analysis:** {summary}\n\n"
            f"**Key Considerations:** Pay close attention to indemnification obligations, limitation of liability caps, and auto-renewal deadlines to mitigate exposure."
        )

    elif relevant_chunks:
        best_chunk = relevant_chunks[0].get("text", "").strip()
        answer = (
            f"### Relevant Contract Provisions\n\n"
            f"Based on the analysis of **{contract_name}**:\n\n"
            f"> \"{best_chunk}\"\n\n"
            f"This section addresses your query regarding contract terms and operational guidelines."
        )

    else:
        summary = contract_meta.get("summary")
        summary_text = f"\n\n**Contract Overview:** {summary}" if summary else ""
        answer = (
            f"### Contract Information\n\n"
            f"I reviewed **{contract_name}** for your query, but could not find a specific dedicated clause matching this exact detail in the extracted text.{summary_text}\n\n"
            f"Feel free to ask about payment terms, renewal dates, termination requirements, or risk assessments."
        )

    return {
        "answer": answer,
        "citations": citations
    }
