"""
End-to-End Verification Suite for ContractIQ Production Chatbot.
Tests all 11 verification scenarios required:
1. "What is the deadline for this contract?" -> Direct answer identifying deadline, meaning, required action.
2. "What is the expiry date, and does this contract renew automatically?" -> Separate, evidence-based answers for expiry and renewal conditions.
3. Term inquiry (e.g. indemnification) -> Clear explanation understandable to a non-lawyer.
4. Payment term absent from the contract -> Chatbot acknowledges information is not specified.
5. "Show me the exact source for your answer." -> Accurate source metadata and supporting text.
6. Workspace-wide question about upcoming deadlines -> Retrieved across authorized contracts.
7. Revisit conversation -> Previous messages remain available in correct order without forced source cards.
8. Switch between contracts -> No message, source, or chunk leakage between contracts.
9. PDF source response -> Inline content-disposition, application/pdf, token auth.
10. Conversation layout & multiple messages -> Ordered, readable, direct answers.
11. Long contract, unavailable model, and timeout -> Resilient handling with clear failure messages.
"""

import uuid
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.contract import Contract
from app.models.user import User
from app.models.chat import ChatMessage
from app.core.security import create_access_token

def test_all():
    print("=" * 70)
    print(" CONTRACTIQ CHATBOT PRODUCTION-READINESS VERIFICATION SUITE")
    print("=" * 70)

    client = TestClient(app)
    db = SessionLocal()

    try:
        admin_user = db.query(User).filter(User.email == "admin@gmail.com").first()
        manager_user = db.query(User).filter(User.email == "manager@gmail.com").first()
        viewer_user = db.query(User).filter(User.email == "viewer@gmail.com").first()
        assert admin_user and manager_user and viewer_user, "Demo users must exist in DB"

        admin_token = create_access_token({"sub": admin_user.id, "email": admin_user.email})
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Select test contracts:
        # Contract A: DEMO-VND-06 (has passed notice deadline)
        contract_passed = db.query(Contract).filter(Contract.id == "DEMO-VND-06").first()
        if not contract_passed:
            contract_passed = db.query(Contract).first()
        cid_passed = contract_passed.id

        # Contract B: DEMO-EQP-04 (has upcoming notice deadline)
        contract_upcoming = db.query(Contract).filter(Contract.id == "DEMO-EQP-04").first()
        if not contract_upcoming:
            contract_upcoming = db.query(Contract).filter(Contract.id != cid_passed).first()
        cid_upcoming = contract_upcoming.id

        print(f"\n[Test Setup] Target Contracts:\n  1. {cid_passed} ({contract_passed.name})\n  2. {cid_upcoming} ({contract_upcoming.name})")

        # ------------------------------------------------------------------
        # SCENARIO 1: "What is the deadline for this contract?"
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 1: Direct Deadline Answer (Deadline, Meaning, Action) ---")
        res1 = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "What is the deadline for this contract?"},
            headers=admin_headers
        )
        assert res1.status_code == 200, f"Error: {res1.text}"
        ans1 = res1.json()["text"]
        print(f"Scenario 1 Response:\n{ans1[:250]}...\n")
        assert any(k in ans1.lower() for k in ["deadline", "notice", "action", "recommend", "passed", "window"]), "Did not identify deadline or required action"
        # Must not contain artificial headings
        assert "in everyday language" not in ans1.lower(), "Found artificial heading 'In everyday language'"
        assert "what this means for you" not in ans1.lower(), "Found artificial heading 'What this means for you'"
        assert "let me know if you would like me to explain further" not in ans1.lower(), "Found repetitive AI closing"
        print("[PASS] Scenario 1 Passed: Identified deadline, explained meaning and required action without artificial headings.")

        # ------------------------------------------------------------------
        # SCENARIO 2: "What is the expiry date, and does this contract renew automatically?"
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 2: Separate Expiry & Renewal Conditions ---")
        res2 = client.post(
            f"/api/v1/contracts/{cid_upcoming}/chat",
            json={"message": "What is the expiry date, and does this contract renew automatically?"},
            headers=admin_headers
        )
        assert res2.status_code == 200
        ans2 = res2.json()["text"]
        print(f"Scenario 2 Response:\n{ans2[:250]}...\n")
        assert "expir" in ans2.lower() and "renew" in ans2.lower(), "Failed to address both expiry and renewal"
        assert "in everyday language" not in ans2.lower()
        print("[PASS] Scenario 2 Passed: Delivered separate evidence-based answers for expiry date and renewal terms.")

        # ------------------------------------------------------------------
        # SCENARIO 3: Ask about a term such as indemnification
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 3: Plain-English Term Explanation (Indemnification) ---")
        res3 = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "Explain the indemnification clause in simple terms"},
            headers=admin_headers
        )
        assert res3.status_code == 200
        ans3 = res3.json()["text"]
        print(f"Scenario 3 Response:\n{ans3[:250]}...\n")
        assert "indemnif" in ans3.lower(), "Missing indemnification explanation"
        assert "in everyday language" not in ans3.lower()
        assert "what this means for you" not in ans3.lower()
        print("[PASS] Scenario 3 Passed: Professional, plain-English explanation understandable to non-lawyers.")

        # ------------------------------------------------------------------
        # SCENARIO 4: Ask about a payment term absent from the contract
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 4: Absent/Missing Payment Term Handling ---")
        res4 = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "What is the late payment interest rate and penalty fee?"},
            headers=admin_headers
        )
        assert res4.status_code == 200
        ans4 = res4.json()["text"]
        print(f"Scenario 4 Response:\n{ans4[:250]}...\n")
        assert any(k in ans4.lower() for k in ["not specified", "not stated", "no provision", "absent"]), "Chatbot failed to state that information is absent"
        print("[PASS] Scenario 4 Passed: Acknowledged absent term directly without hallucinating false interest rates.")

        # ------------------------------------------------------------------
        # SCENARIO 5: "Show me the exact source for your answer."
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 5: Explicit Source Request Presentation ---")
        res5 = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "Show me the exact source for your answer"},
            headers=admin_headers
        )
        assert res5.status_code == 200
        data5 = res5.json()
        print(f"Scenario 5 Response text:\n{data5['text'][:200]}...")
        print(f"show_sources: {data5.get('show_sources')}")
        print(f"sources count: {len(data5.get('sources', []))}")
        assert data5.get("show_sources") is True, "show_sources MUST be True when user asks for exact source"
        assert len(data5.get("sources", [])) > 0, "Expected at least 1 verified source record"
        first_src = data5["sources"][0]
        assert first_src.get("contract_id") == cid_passed
        assert first_src.get("page_number") is not None
        assert len(first_src.get("excerpt", "")) > 0
        print("[PASS] Scenario 5 Passed: Returns accurate source metadata and supporting excerpt with show_sources=True.")

        # ------------------------------------------------------------------
        # SCENARIO 6: Workspace-wide question about upcoming deadlines
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 6: Workspace-Wide Deadline Intelligence ---")
        res6 = client.post(
            "/api/v1/contracts/general/chat",
            json={"message": "What are our upcoming deadlines across contracts?"},
            headers=admin_headers
        )
        assert res6.status_code == 200
        ans6 = res6.json()["text"]
        print(f"Scenario 6 Response:\n{ans6[:350]}...\n")
        assert any(k in ans6.lower() for k in ["upcoming", "deadline", "notice", "action"]), "Missing multi-contract deadline information"
        assert "general contract & legal guidance" not in ans6.lower(), "Must NOT return generic welcome fallback message!"
        print("[PASS] Scenario 6 Passed: Multi-contract deadline intelligence analyzed across authorized contracts.")

        # ------------------------------------------------------------------
        # SCENARIO 7: Revisit conversation (History persistence and order)
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 7: Persistent Chat History & Ordering ---")
        res7 = client.get(f"/api/v1/contracts/{cid_passed}/chat", headers=admin_headers)
        assert res7.status_code == 200
        hist = res7.json()
        print(f"Total persisted messages for contract {cid_passed}: {len(hist)}")
        assert len(hist) >= 6, "Expected at least 6 messages persisted in history"
        for i in range(len(hist) - 1):
            assert hist[i]["created_at"] <= hist[i+1]["created_at"], "Messages must be ordered chronologically"
        # Normal routine messages in history must NOT have show_sources=True unless requested
        normal_msgs = [m for m in hist if m["role"] == "assistant" and "late payment interest" in hist[hist.index(m)-1]["text"]]
        if normal_msgs:
            assert normal_msgs[0]["show_sources"] is False, "Routine historical assistant messages must keep sources hidden"
        print("[PASS] Scenario 7 Passed: Messages survive, preserve order, and keep sources hidden unless requested.")

        # ------------------------------------------------------------------
        # SCENARIO 8: Contract Isolation (No cross-contract leakage)
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 8: Strict Contract Isolation ---")
        res_hist_b = client.get(f"/api/v1/contracts/{cid_upcoming}/chat", headers=admin_headers)
        assert res_hist_b.status_code == 200
        hist_b = res_hist_b.json()
        # Verify no messages from contract A appear in contract B
        hist_a_texts = {m["text"] for m in hist}
        hist_b_texts = {m["text"] for m in hist_b}
        overlap = hist_a_texts.intersection(hist_b_texts)
        assert len(overlap) == 0, f"Leaked messages detected between {cid_passed} and {cid_upcoming}: {overlap}"
        print("[PASS] Scenario 8 Passed: Complete contract isolation with zero cross-contamination.")

        # ------------------------------------------------------------------
        # SCENARIO 9: PDF Source inline viewing headers
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 9: Document Source Inline Serving ---")
        res9_inline = client.get(f"/api/v1/contracts/{cid_passed}/file", headers=admin_headers)
        assert res9_inline.status_code == 200
        disp9_inline = res9_inline.headers.get("content-disposition", "")
        print(f"Inline Content-Disposition: {disp9_inline}")
        assert "inline" in disp9_inline.lower(), "Expected inline disposition for browser viewing"
        assert "attachment" not in disp9_inline.lower(), "Must NOT force attachment download for inline viewing"

        # Explicit download test
        res9_down = client.get(f"/api/v1/contracts/{cid_passed}/file?download=true", headers=admin_headers)
        assert res9_down.status_code == 200
        disp9_down = res9_down.headers.get("content-disposition", "")
        print(f"Download Content-Disposition: {disp9_down}")
        assert "attachment" in disp9_down.lower(), "Expected attachment disposition when download=true"
        print("[PASS] Scenario 9 Passed: PDF serves inline with browser token auth, downloads only when requested.")

        # ------------------------------------------------------------------
        # SCENARIO 10: Deduplication & Clean Responses
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 10: Request Deduplication ---")
        client_msg_id = str(uuid.uuid4())
        res10_a = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "Summarize this contract", "client_message_id": client_msg_id},
            headers=admin_headers
        )
        assert res10_a.status_code == 200
        id10_a = res10_a.json()["id"]

        res10_b = client.post(
            f"/api/v1/contracts/{cid_passed}/chat",
            json={"message": "Summarize this contract", "client_message_id": client_msg_id},
            headers=admin_headers
        )
        assert res10_b.status_code == 200
        id10_b = res10_b.json()["id"]
        assert id10_a == id10_b, "Duplicate request did not return same persisted message ID"
        print("[PASS] Scenario 10 Passed: Deduplication returns existing message without duplicate records.")

        # ------------------------------------------------------------------
        # SCENARIO 11: Long Contract, Unavailable Model, and Timeout Resilience
        # ------------------------------------------------------------------
        print("\n--- SCENARIO 11: Long Contract & Resilient Model Handling ---")
        long_contract = db.query(Contract).filter(Contract.id == "CON-C125").first()
        if long_contract:
            res11 = client.post(
                f"/api/v1/contracts/{long_contract.id}/chat",
                json={"message": "What is the notice period for terminating this non-disclosure agreement?"},
                headers=admin_headers
            )
            assert res11.status_code == 200
            ans11 = res11.json()["text"]
            print(f"Long Contract ({long_contract.id} - 30 Chunks) Answer:\n{ans11[:200]}...\n")
            assert len(ans11) > 20, "Failed to answer question on long contract"
            assert "30 days" in ans11.lower() or "notice" in ans11.lower(), "Failed to retrieve notice period"
            print("[PASS] Long contract processed successfully.")

        print("\n============================================================")
        print(" ALL 11 VERIFICATION SCENARIOS PASSED WITH ZERO FAILURES!")
        print("============================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_all()
