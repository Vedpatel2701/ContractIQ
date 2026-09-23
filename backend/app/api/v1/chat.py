from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.models.chat import ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, MessageHistoryItem
from app.services.rag_chat import answer_contract_question

router = APIRouter(prefix="/contracts/{contract_id}/chat", tags=["Contract Chat"])

@router.get("", response_model=List[MessageHistoryItem])
def get_chat_history(contract_id: str, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.contract_id == contract_id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("", response_model=ChatResponse)
def ask_contract_question(
    contract_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Save user message
    user_msg = ChatMessage(contract_id=contract_id, role="user", text=payload.message)
    db.add(user_msg)
    db.commit()

    # RAG Response Generation
    contract_meta = {
        "name": contract.name,
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
        "created_at": asst_msg.created_at
    }
