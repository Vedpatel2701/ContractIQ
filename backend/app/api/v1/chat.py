import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageHistoryItem, SourceItem
from app.services.rag_chat import answer_contract_question, answer_general_question, is_source_requested
from app.api.deps import get_current_user_or_demo, verify_contract_access, filter_authorized_contracts

router = APIRouter(prefix="/contracts/{contract_id}/chat", tags=["Contract Chat"])

def parse_json_safely(raw_str: str, default):
    if not raw_str:
        return default
    try:
        return json.loads(raw_str)
    except Exception:
        return default

@router.get("", response_model=List[MessageHistoryItem])
def get_chat_history(
    contract_id: str,
    current_user: User = Depends(get_current_user_or_demo),
    db: Session = Depends(get_db)
):
    """
    Returns previous chat history for the current user and context.
    Strictly isolated: does not expose one user's conversation to another user.
    """
    if contract_id != "general":
        verify_contract_access(contract_id, current_user, db)
        query = db.query(ChatMessage).filter(
            ChatMessage.contract_id == contract_id,
            ChatMessage.user_id == current_user.id
        )
    else:
        query = db.query(ChatMessage).filter(
            (ChatMessage.contract_id == None) | (ChatMessage.contract_id == "general"),
            ChatMessage.user_id == current_user.id
        )

    messages = query.order_by(ChatMessage.created_at.asc()).all()

    formatted: List[MessageHistoryItem] = []
    prev_user_asked_sources = False
    for m in messages:
        if m.role == "user":
            prev_user_asked_sources = is_source_requested(m.text or "")
        sources_list = parse_json_safely(m.sources, [])
        citations_list = parse_json_safely(m.citations, [])
        has_sources = bool(sources_list or citations_list)
        show_sources = has_sources and m.role == "assistant" and prev_user_asked_sources

        formatted.append(MessageHistoryItem(
            id=m.id,
            role=m.role,
            text=m.text,
            citations=citations_list,
            sources=sources_list,
            show_sources=show_sources,
            created_at=m.created_at
        ))
    return formatted

@router.post("", response_model=ChatResponse)
def ask_contract_question(
    contract_id: str,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user_or_demo),
    db: Session = Depends(get_db)
):
    """
    Processes a chat query within the given contract context (or workspace general mode).
    Enforces deduplication, user isolation, contract isolation, and persists messages and sources.
    """
    # 1. Deduplication check using client_message_id
    if payload.client_message_id:
        existing_user_msg = db.query(ChatMessage).filter(
            ChatMessage.client_message_id == payload.client_message_id,
            ChatMessage.user_id == current_user.id
        ).first()

        if existing_user_msg:
            # Find matching assistant message created immediately after
            existing_asst_msg = db.query(ChatMessage).filter(
                ChatMessage.user_id == current_user.id,
                ChatMessage.role == "assistant",
                ChatMessage.created_at >= existing_user_msg.created_at
            ).order_by(ChatMessage.created_at.asc()).first()

            if existing_asst_msg:
                sources_data = parse_json_safely(existing_asst_msg.sources, [])
                citations_data = parse_json_safely(existing_asst_msg.citations, [])
                prev_asked = is_source_requested(payload.message)
                return {
                    "id": existing_asst_msg.id,
                    "role": "assistant",
                    "text": existing_asst_msg.text,
                    "citations": citations_data if prev_asked else [],
                    "sources": sources_data,
                    "show_sources": bool((sources_data or citations_data) and prev_asked),
                    "created_at": existing_asst_msg.created_at
                }

    # 2. General workspace assistant mode
    if contract_id == "general":
        # Save user message
        user_msg = ChatMessage(
            contract_id=None,
            user_id=current_user.id,
            role="user",
            text=payload.message,
            client_message_id=payload.client_message_id
        )
        db.add(user_msg)
        db.commit()

        # Only query contracts authorized for current user
        authorized_contracts = filter_authorized_contracts(db.query(Contract), current_user).all()
        contracts_meta = [
            {
                "id": c.id,
                "name": c.name,
                "company": c.company,
                "contract_type": c.contract_type,
                "risk_level": c.risk_level,
                "start_date": c.start_date,
                "expiry_date": c.expiry_date,
                "renewal_date": c.renewal_date,
                "notice_period": c.notice_period,
                "payment_terms": c.payment_terms,
                "penalty_info": c.penalty_info,
                "summary": c.summary,
            }
            for c in authorized_contracts
        ]
        rag_result = answer_general_question(payload.message, contracts_meta, db=db)

        # Save assistant message
        asst_msg = ChatMessage(
            contract_id=None,
            user_id=current_user.id,
            role="assistant",
            text=rag_result["answer"],
            citations=json.dumps(rag_result.get("citations", [])),
            sources=json.dumps(rag_result.get("sources", []))
        )
        db.add(asst_msg)
        db.commit()
        db.refresh(asst_msg)

        return {
            "id": asst_msg.id,
            "role": "assistant",
            "text": asst_msg.text,
            "citations": rag_result.get("citations", []),
            "sources": rag_result.get("sources", []),
            "show_sources": bool(rag_result.get("show_sources", False)),
            "created_at": asst_msg.created_at
        }

    # 3. Contract-specific assistant mode
    # Enforce strict contract authorization before RAG or storing messages
    contract = verify_contract_access(contract_id, current_user, db)

    # Save user message
    user_msg = ChatMessage(
        contract_id=contract_id,
        user_id=current_user.id,
        role="user",
        text=payload.message,
        client_message_id=payload.client_message_id
    )
    db.add(user_msg)
    db.commit()

    # RAG Response Generation
    contract_meta = {
        "name": contract.name,
        "company": contract.company,
        "contract_type": contract.contract_type,
        "file_name": contract.file_name,
        "start_date": contract.start_date,
        "expiry_date": contract.expiry_date,
        "renewal_date": contract.renewal_date,
        "notice_period": contract.notice_period,
        "payment_terms": contract.payment_terms,
        "penalty_info": contract.penalty_info,
        "risk_level": contract.risk_level,
        "summary": contract.summary,
        "customer": contract.customer,
        "vendor": contract.vendor
    }

    rag_result = answer_contract_question(contract_id, payload.message, contract_meta, db=db)

    # Save assistant response with sources and citations
    sources_to_save = rag_result.get("sources", [])
    citations_to_save = rag_result.get("citations", [])

    asst_msg = ChatMessage(
        contract_id=contract_id,
        user_id=current_user.id,
        role="assistant",
        text=rag_result["answer"],
        sources=json.dumps(sources_to_save),
        citations=json.dumps(citations_to_save)
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return {
        "id": asst_msg.id,
        "role": asst_msg.role,
        "text": asst_msg.text,
        "citations": citations_to_save,
        "sources": sources_to_save,
        "show_sources": bool(rag_result.get("show_sources", False)),
        "created_at": asst_msg.created_at
    }

@router.delete("")
def clear_chat_history(
    contract_id: str,
    current_user: User = Depends(get_current_user_or_demo),
    db: Session = Depends(get_db)
):
    """
    Clears conversation history for the current user in this context.
    """
    if contract_id != "general":
        verify_contract_access(contract_id, current_user, db)
        db.query(ChatMessage).filter(
            ChatMessage.contract_id == contract_id,
            ChatMessage.user_id == current_user.id
        ).delete()
    else:
        db.query(ChatMessage).filter(
            (ChatMessage.contract_id == None) | (ChatMessage.contract_id == "general"),
            ChatMessage.user_id == current_user.id
        ).delete()

    db.commit()
    return {"message": "Chat history cleared successfully", "contract_id": contract_id}
