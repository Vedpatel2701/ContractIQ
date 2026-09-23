import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import RiskIndicator
from app.schemas.contract import ContractResponse
from app.services.extractor import extract_text_from_file
from app.services.chunker import chunk_contract_text
from app.services.vector_store import VectorStore
from app.services.llm import classify_document_text, analyze_contract_text

router = APIRouter(prefix="/contracts", tags=["Contracts"])

def format_contract_response(c: Contract) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "contractType": c.contract_type or "Commercial Agreement",
        "company": c.company,
        "status": c.status,
        "riskLevel": c.risk_level,
        "startDate": c.start_date,
        "expiryDate": c.expiry_date,
        "renewalDate": c.renewal_date,
        "noticePeriod": c.notice_period,
        "paymentTerms": c.payment_terms,
        "penaltyInfo": c.penalty_info,
        "summary": c.summary,
        "lastUpdated": c.updated_at.strftime("%Y-%m-%d") if c.updated_at else None,
        "clauses": [cl.text for cl in c.clauses] if c.clauses else [],
        "riskIndicators": [r.description for r in c.risk_indicators] if c.risk_indicators else [],
        "parties": {
            "customer": c.customer or "Customer",
            "vendor": c.vendor or c.company,
            "legalOwner": c.legal_owner or "Legal Team"
        },
        "fileName": c.file_name,
        "fileSize": c.file_size
    }

@router.get("", response_model=List[ContractResponse])
def get_contracts(
    status: Optional[str] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Contract)
    if status and status != "All":
        query = query.filter(Contract.status == status)
    if risk and risk != "All":
        query = query.filter(Contract.risk_level == risk)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter((Contract.name.ilike(search_fmt)) | (Contract.company.ilike(search_fmt)) | (Contract.id.ilike(search_fmt)))
        
    contracts = query.order_by(Contract.created_at.desc()).all()
    return [format_contract_response(c) for c in contracts]

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return format_contract_response(contract)

@router.post("/upload", response_model=ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    company: Optional[str] = Form(None),
    contract_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    temp_dir = settings.UPLOAD_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_id = uuid.uuid4().hex[:8]
    temp_file_path = temp_dir / f"{temp_id}_{file.filename}"

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size_bytes = os.path.getsize(temp_file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read uploaded file: {e}")

    # 1. Extract text
    extracted_text = extract_text_from_file(str(temp_file_path))
    if not extracted_text or len(extracted_text.strip()) < 20:
        if temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(
            status_code=422,
            detail={
                "is_contract": False,
                "detected_type": "Unreadable or Blank Document",
                "reason": "The file contains no readable text. If this is a scanned document, ensure text is legible.",
                "message": "Document not accepted: No readable text found."
            }
        )

    # 2. Document Classification (Reject non-contracts)
    classification = classify_document_text(extracted_text)
    if not classification.get("is_contract", False):
        if temp_file_path.exists():
            temp_file_path.unlink()
        detected = classification.get("detected_type", "Non-Contract Document")
        reason = classification.get("reason", "This document is not a legal contract or agreement.")
        missing = classification.get("missing_elements", [])
        present = classification.get("present_elements", [])
        raise HTTPException(
            status_code=422,
            detail={
                "is_contract": False,
                "detected_type": detected,
                "reason": reason,
                "missing_elements": missing,
                "present_elements": present,
                "message": f"Document rejected: Detected '{detected}'. ContractIQ requires a binding contract or legal agreement."
            }
        )

    # 3. Create persistent Contract Record (Only after verification)
    final_contract_id = f"CON-{uuid.uuid4().hex[:4].upper()}"
    final_dir = settings.UPLOAD_DIR / final_contract_id
    final_dir.mkdir(parents=True, exist_ok=True)
    final_file_path = final_dir / file.filename
    shutil.move(str(temp_file_path), str(final_file_path))

    size_str = f"{round(file_size_bytes / (1024 * 1024), 2)} MB" if file_size_bytes >= 1048576 else f"{round(file_size_bytes / 1024, 1)} KB"

    # 4. Chunk text and index in isolated VectorStore
    chunks = chunk_contract_text(extracted_text)
    if chunks:
        vector_store = VectorStore(final_contract_id)
        vector_store.add_chunks(chunks)

    # 5. Extract actual contract terms via LLM / accurate NLP
    analysis = analyze_contract_text(extracted_text)
    
    inferred_name = contract_name or analysis.get("contractType") or file.filename.rsplit(".", 1)[0].replace("_", " ").title()
    inferred_company = company or analysis.get("company") or "Contract Partner"

    contract = Contract(
        id=final_contract_id,
        name=inferred_name,
        contract_type=analysis.get("contractType", "Commercial Agreement"),
        company=inferred_company,
        status=analysis.get("status", "Active"),
        risk_level=analysis.get("riskLevel", "Not Assessed"),
        start_date=analysis.get("startDate"),
        expiry_date=analysis.get("expiryDate"),
        renewal_date=analysis.get("renewalDate"),
        notice_period=analysis.get("noticePeriod"),
        payment_terms=analysis.get("paymentTerms"),
        penalty_info=analysis.get("penaltyInfo"),
        summary=analysis.get("summary"),
        customer=analysis.get("customer"),
        vendor=analysis.get("vendor"),
        file_path=str(final_file_path),
        file_name=file.filename,
        file_size=size_str,
        extracted_text=extracted_text
    )
    db.add(contract)
    db.commit()

    # Add extracted clauses
    for clause_text in analysis.get("clauses", []):
        db.add(Clause(contract_id=contract.id, text=clause_text))

    # Add risk indicators
    for risk_text in analysis.get("riskIndicators", []):
        db.add(RiskIndicator(contract_id=contract.id, description=risk_text, severity=contract.risk_level))

    db.commit()
    db.refresh(contract)
    return format_contract_response(contract)

@router.delete("/{contract_id}")
def delete_contract(contract_id: str, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Delete vector index if exists
    vector_file = settings.VECTOR_INDEX_DIR / f"{contract_id}_index.json"
    if vector_file.exists():
        vector_file.unlink()

    # Delete uploaded files
    upload_dir = settings.UPLOAD_DIR / contract_id
    if upload_dir.exists():
        shutil.rmtree(upload_dir, ignore_errors=True)

    db.delete(contract)
    db.commit()
    return {"message": "Contract deleted successfully", "id": contract_id}
