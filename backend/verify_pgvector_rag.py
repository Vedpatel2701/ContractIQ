"""
Verification Script for ContractIQ PostgreSQL + Vector RAG Pipeline.
Verifies Vector Storage, Cosine Similarity Search, Contract Isolation,
RAG API Chat, and Keyword Fallback.
"""
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.database import SessionLocal, engine
from app.models.contract import Contract
from app.models.chunk import ContractChunk
from app.services.vector_store import VectorStore
from app.services.embeddings import generate_embedding

def verify_all():
    print("=" * 20 + " VERIFICATION STEP 1 & 2: PostgreSQL & Vector Storage Schema " + "=" * 20)
    db = SessionLocal()
    try:
        chunk_count = db.query(ContractChunk).count()
        print(f"PostgreSQL contract_chunks table exists. Total stored chunks: {chunk_count}")
        assert chunk_count > 0, "No chunks found in PostgreSQL!"
        
        sample_chunk = db.query(ContractChunk).first()
        assert sample_chunk.embedding is not None, "Sample chunk has null embedding!"
        print(f"Verified chunk ID: {sample_chunk.id}, Contract ID: {sample_chunk.contract_id}, Vector dimension: {len(sample_chunk.embedding)}")
    finally:
        db.close()

    print("\n" + "=" * 20 + " VERIFICATION STEP 3 & 4 & 5: Real Cosine Similarity Search & Isolation " + "=" * 20)
    # Pick contract CON-2653
    target_contract_id = "CON-2653"
    vs = VectorStore(target_contract_id)
    
    query = "What is the penalty or SLA requirement?"
    results = vs.search(query, top_k=4)
    
    print(f"Query: '{query}' for Contract: {target_contract_id}")
    print(f"Retrieved {len(results)} chunks.")
    
    for r in results:
        cid = r.get("contract_id")
        score = r.get("score")
        print(f"  - Chunk ID #{r.get('chunk_id')}, Contract: {cid}, Cosine Similarity Score: {score}")
        assert cid == target_contract_id, f"LEAK DETECTED! Chunk belonging to contract {cid} returned for query to {target_contract_id}"
    
    print("SUCCESS: All retrieved chunks strictly belong to requested contract ID.")

    print("\n" + "=" * 20 + " VERIFICATION STEP 6 & 7: Contract Assistant RAG API Test " + "=" * 20)
    client = TestClient(app)
    
    res = client.post(f"/api/v1/contracts/{target_contract_id}/chat", json={
        "message": "What is the notice period for termination?"
    })
    print(f"POST /api/v1/contracts/{target_contract_id}/chat status code: {res.status_code}")
    assert res.status_code == 200, f"Chat API failed: {res.text}"
    
    chat_resp = res.json()
    answer = chat_resp.get("text", "")
    citations = chat_resp.get("citations", [])
    print(f"Assistant Answer Excerpt: {answer[:160]}...")
    print(f"Citations count: {len(citations)}")
    assert len(answer) > 20, "Answer text is too short!"

    print("\n" + "=" * 20 + " VERIFICATION STEP 8: Keyword Fallback Test " + "=" * 20)
    # Perform keyword search fallback test
    fallback_results = vs._search_keyword_fallback("termination notice", top_k=2)
    print(f"Keyword fallback retrieved {len(fallback_results)} chunks.")
    assert len(fallback_results) > 0, "Keyword fallback failed!"
    print("SUCCESS: Keyword search fallback works as expected.")

    print("\n" + "=" * 20 + " VERIFICATION STEP 9: Test Suite Execution " + "=" * 20)
    # Check existing contracts API endpoint
    res_list = client.get("/api/v1/contracts")
    assert res_list.status_code == 200
    print(f"Retrieved {len(res_list.json())} contracts from API.")

    res_dash = client.get("/api/v1/dashboard")
    assert res_dash.status_code == 200
    print(f"Dashboard summary retrieved successfully.")

    print("\n" + "=" * 50)
    print(" ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 50)

if __name__ == "__main__":
    verify_all()
