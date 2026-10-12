"""
Script to chunk and index real vector embeddings into PostgreSQL contract_chunks
for all existing contracts in the PostgreSQL database.
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.contract import Contract
from app.services.chunker import chunk_contract_text
from app.services.vector_store import VectorStore

def index_all():
    db: Session = SessionLocal()
    try:
        contracts = db.query(Contract).all()
        print(f"Found {len(contracts)} contracts in PostgreSQL database.")
        
        for c in contracts:
            text = c.extracted_text or f"{c.name}\n\nCompany: {c.company}\nType: {c.contract_type}\nSummary: {c.summary}\nPayment terms: {c.payment_terms}\nNotice period: {c.notice_period}\nPenalty info: {c.penalty_info}"
            chunks = chunk_contract_text(text)
            if not chunks:
                chunks = [{"text": text, "page_number": 1, "section": "Summary"}]
            
            print(f"Indexing contract {c.id} ({c.name}) with {len(chunks)} chunks...")
            vs = VectorStore(c.id)
            vs.add_chunks(chunks, db=db)
            
        print("\nSuccessfully indexed all existing contracts into PostgreSQL vector storage!")
    finally:
        db.close()

if __name__ == "__main__":
    index_all()
