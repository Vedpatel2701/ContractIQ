"""
Source Metadata & Open Source Action Verification Script
"""
from fastapi.testclient import TestClient
from app.main import app

def test_source_metadata():
    client = TestClient(app)
    contract_id = "CON-2653"

    print("="*20 + " TEST 1: Answer with Grounded Database Sources " + "="*20)
    res = client.post(f"/api/v1/contracts/{contract_id}/chat", json={
        "message": "What is the notice period for contract termination?"
    })
    assert res.status_code == 200, f"Chat endpoint failed: {res.text}"
    data = res.json()

    print("Answer excerpt:", data["text"][:150] + "...")
    assert "sources" in data, "No 'sources' field returned in ChatResponse!"
    sources = data["sources"]
    print(f"Retrieved {len(sources)} structured sources.")
    assert len(sources) > 0, "Expected at least 1 source!"

    for idx, s in enumerate(sources):
        print(f"\n--- Source #{idx+1} ---")
        print(f"  Contract ID: {s['contract_id']}")
        print(f"  Document Name: {s['document_name']}")
        print(f"  Chunk ID: {s['chunk_id']}")
        print(f"  Page Number: {s['page_number']}")
        print(f"  Section: {s['section']}")
        print(f"  Excerpt: {s['excerpt'][:100]}...")
        print(f"  File URL: {s['file_url']}")

        # Verification 3: Every source belongs to requested contract
        assert s["contract_id"] == contract_id, f"LEAK DETECTED: Source belongs to contract {s['contract_id']} instead of {contract_id}!"
        # Verification 4: Source metadata comes from database chunk
        assert s["chunk_id"] >= 0, "Invalid chunk ID!"

    print("\n" + "="*20 + " TEST 2: Open Source File Viewing Endpoint " + "="*20)
    file_url = sources[0]["file_url"]
    file_res = client.get(file_url)
    print(f"GET {file_url} status code: {file_res.status_code}")
    assert file_res.status_code == 200, f"File viewing failed: {file_res.text}"
    print("File headers content-type:", file_res.headers.get("content-type"))

    print("\n" + "="*20 + " TEST 3: Off-Topic Query (No Source Fabrication) " + "="*20)
    off_topic_res = client.post(f"/api/v1/contracts/{contract_id}/chat", json={
        "message": "Who won the cricket world cup final?"
    }).json()
    print("Off-topic answer excerpt:", off_topic_res["text"][:120] + "...")
    off_topic_sources = off_topic_res.get("sources", [])
    assert len(off_topic_sources) == 0, f"FABRICATION ERROR: Returned sources for off-topic query! Got: {off_topic_sources}"
    print("SUCCESS: System cleanly declined off-topic query without fabricating sources.")

    print("\n" + "="*50)
    print(" ALL SOURCE METADATA & OPEN SOURCE VERIFICATIONS PASSED SUCCESSFULLY! ")
    print("="*50)

if __name__ == "__main__":
    test_source_metadata()
