import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageHistoryItem
from app.services.rag_chat import answer_contract_question, answer_general_question
from app.api.deps import get_current_user, verify_contract_access, filter_authorized_contracts

router = APIRouter(prefix="/contracts/{contract_id}/chat", tags=["Contract Chat"])

@router.get("", response_model=List[MessageHistoryItem])
def get_chat_history(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if contract_id == "general":
        return []
    
    # Enforce contract authorization before reading chat history
    verify_contract_access(contract_id, current_user, db)
        
    messages = db.query(ChatMessage).filter(ChatMessage.contract_id == contract_id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("", response_model=ChatResponse)
def ask_contract_question(
    contract_id: str,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if contract_id == "general":
        # Only query contracts authorized for current user
        authorized_contracts = filter_authorized_contracts(db.query(Contract), current_user).all()
        contracts_meta = [
            {"name": c.name, "company": c.company, "risk_level": c.risk_level, "expiry_date": c.expiry_date}
            for c in authorized_contracts
        ]
        rag_result = answer_general_question(payload.message, contracts_meta)
        return {
            "id": f"asst-gen-{uuid.uuid4().hex[:6]}",
            "role": "assistant",
            "text": rag_result["answer"],
            "citations": rag_result.get("citations", []),
            "created_at": None
        }

    # Enforce contract authorization before performing RAG or storing chat message
    contract = verify_contract_access(contract_id, current_user, db)

    # Save user message
    user_msg = ChatMessage(contract_id=contract_id, role="user", text=payload.message)
    db.add(user_msg)
    db.commit()

    # RAG Response Generation
    contract_meta = {
        "name": contract.name,
        "file_name": contract.file_name,
        "renewal_date": contract.renewal_date,
        "notice_period": contract.notice_period,
        "payment_terms": contract.payment_terms,
        "penalty_info": contract.penalty_info,
        "risk_level": contract.risk_level,
        "summary": contract.summary
    }
    
    rag_result = answer_contract_question(contract_id, payload.message, contract_meta)
    
    # Save assistant response
    asst_msg = ChatMessage(contract_id=contract_id, role="assistant", text=rag_result["answer"])
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return {
        "id": asst_msg.id,
        "role": asst_msg.role,
        "text": asst_msg.text,
        "citations": rag_result.get("citations", []),
        "sources": rag_result.get("sources", []),
        "created_at": asst_msg.created_at
    }
