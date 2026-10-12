import os
import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app, init_db
from app.core.database import SessionLocal, Base, engine
from app.models import User, UserRole, Contract, Clause, RiskIndicator, ChatMessage
from app.core.security import hash_password, create_access_token
from verify_phase1_ocr import verify_phase1
from verify_phase2_validation import verify_phase2


def run_phase3_verification():
    print("==================================================")
    print("      CONTRACTIQ PHASE 3 SECURITY VERIFICATION    ")
    print("==================================================")
    
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    # Create fresh test users for isolated testing
    admin_email = f"testadmin_{uuid.uuid4().hex[:4]}@contractiq.com"
    manager1_email = f"mgr1_{uuid.uuid4().hex[:4]}@contractiq.com"
    manager2_email = f"mgr2_{uuid.uuid4().hex[:4]}@contractiq.com"
    viewer_email = f"viewer_{uuid.uuid4().hex[:4]}@contractiq.com"
    pwd = "TestPassword123!"

    admin = User(email=admin_email, full_name="Admin Test", hashed_password=hash_password(pwd), role=UserRole.ADMIN.value)
    mgr1 = User(email=manager1_email, full_name="Manager One", hashed_password=hash_password(pwd), role=UserRole.CONTRACT_MANAGER.value)
    mgr2 = User(email=manager2_email, full_name="Manager Two", hashed_password=hash_password(pwd), role=UserRole.CONTRACT_MANAGER.value)
    viewer = User(email=viewer_email, full_name="Viewer Test", hashed_password=hash_password(pwd), role=UserRole.VIEWER.value)

    db.add_all([admin, mgr1, mgr2, viewer])
    db.commit()
    db.refresh(admin)
    db.refresh(mgr1)
    db.refresh(mgr2)
    db.refresh(viewer)

    # 1. TEST INVALID CREDENTIALS
    print("\n[TEST 1] Invalid Credentials & Auth Handling...")
    res_bad_pwd = client.post("/api/v1/auth/login", json={"email": manager1_email, "password": "WrongPassword"})

    assert res_bad_pwd.status_code == 401, f"Expected 401 for wrong password, got {res_bad_pwd.status_code}"
    
    res_bad_user = client.post("/api/v1/auth/login", json={"email": "nonexistent@contractiq.com", "password": pwd})
    assert res_bad_user.status_code == 401, f"Expected 401 for non-existent user, got {res_bad_user.status_code}"
    print("  [OK] Invalid login attempts correctly returned 401 Unauthorized.")

    # 2. TEST VALID LOGIN & TOKEN GENERATION
    print("\n[TEST 2] Valid Login & JWT Issuance...")
    res_login_admin = client.post("/api/v1/auth/login", json={"email": admin_email, "password": pwd})
    assert res_login_admin.status_code == 200, f"Admin login failed: {res_login_admin.text}"
    admin_token = res_login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_login_mgr1 = client.post("/api/v1/auth/login", json={"email": manager1_email, "password": pwd})
    assert res_login_mgr1.status_code == 200, f"Manager 1 login failed: {res_login_mgr1.text}"
    mgr1_token = res_login_mgr1.json()["access_token"]
    mgr1_headers = {"Authorization": f"Bearer {mgr1_token}"}

    res_login_mgr2 = client.post("/api/v1/auth/login", json={"email": manager2_email, "password": pwd})
    assert res_login_mgr2.status_code == 200, f"Manager 2 login failed: {res_login_mgr2.text}"
    mgr2_token = res_login_mgr2.json()["access_token"]
    mgr2_headers = {"Authorization": f"Bearer {mgr2_token}"}

    res_login_viewer = client.post("/api/v1/auth/login", json={"email": viewer_email, "password": pwd})
    assert res_login_viewer.status_code == 200, f"Viewer login failed: {res_login_viewer.text}"
    viewer_token = res_login_viewer.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    print("  [OK] Login succeeded for all roles; valid Bearer tokens issued.")

    # 3. TEST UNAUTHENTICATED ACCESS ATTEMPTS
    print("\n[TEST 3] Unauthenticated Endpoint Protection...")
    assert client.get("/api/v1/contracts").status_code == 401
    assert client.get("/api/v1/contracts/CON-1042").status_code == 401
    assert client.get("/api/v1/contracts/CON-1042/file").status_code == 401
    assert client.get("/api/v1/contracts/CON-1042/chat").status_code == 401
    assert client.get("/api/v1/dashboard").status_code == 401
    assert client.get("/api/v1/notifications").status_code == 401
    assert client.post("/api/v1/contracts/upload").status_code == 401
    print("  [OK] Unauthenticated requests blocked with 401 Unauthorized across all protected endpoints.")

    # 4. TEST ROLE-BASED ACCESS CONTROL (RBAC)
    print("\n[TEST 4] Role-Based Access Control (RBAC)...")
    # Admin can list users
    res_users = client.get("/api/v1/auth/users", headers=admin_headers)
    assert res_users.status_code == 200 and len(res_users.json()) >= 4, f"Admin users list failed: {res_users.text}"

    # Contract Manager cannot list users
    assert client.get("/api/v1/auth/users", headers=mgr1_headers).status_code == 403
    # Viewer cannot list users
    assert client.get("/api/v1/auth/users", headers=viewer_headers).status_code == 403
    print("  [OK] Admin user management protected; Contract Manager & Viewer blocked with 403 Forbidden.")

    # 5. CREATE CONTRACTS FOR ISOLATED CONTRACT-LEVEL AUTHORIZATION TESTING
    print("\n[TEST 5] Contract-Level Authorization Setup & Upload Permissions...")
    # Viewer cannot upload contract
    viewer_upload = client.post(
        "/api/v1/contracts/upload",
        files={"file": ("test.pdf", b"Some content", "application/pdf")},
        headers=viewer_headers
    )
    assert viewer_upload.status_code == 403, f"Expected 403 for viewer upload, got {viewer_upload.status_code}"
    print("  [OK] Viewer upload attempt blocked with 403 Forbidden.")

    # Create private contract owned by Manager 1 directly in DB
    private_con1_id = f"CON-MGR1-{uuid.uuid4().hex[:4].upper()}"
    private_con1 = Contract(
        id=private_con1_id,
        owner_id=mgr1.id,
        is_demo=False,
        name="Manager 1 Confidential Agreement",
        contract_type="Non-Disclosure Agreement",
        company="Secret Manager Corp",
        status="Active",
        risk_level="High",
        summary="Confidential terms between Manager 1 and Secret Corp.",
        extracted_text="This is a strictly confidential NDA belonging exclusively to Manager 1."
    )
    db.add(private_con1)
    db.commit()

    # 6. CONTRACT-LEVEL AUTHORIZATION TESTS
    print("\n[TEST 6] Contract ID Tampering & Multi-Tenant Isolation...")
    # Manager 1 can access own contract
    assert client.get(f"/api/v1/contracts/{private_con1_id}", headers=mgr1_headers).status_code == 200
    # Admin can access Manager 1's contract
    assert client.get(f"/api/v1/contracts/{private_con1_id}", headers=admin_headers).status_code == 200

    # Manager 2 CANNOT access Manager 1's private contract by guessing ID
    mgr2_access = client.get(f"/api/v1/contracts/{private_con1_id}", headers=mgr2_headers)
    assert mgr2_access.status_code == 403, f"Expected 403 for Manager 2 contract access, got {mgr2_access.status_code}"

    # Viewer CANNOT access Manager 1's private contract by guessing ID
    viewer_access = client.get(f"/api/v1/contracts/{private_con1_id}", headers=viewer_headers)
    assert viewer_access.status_code == 403, f"Expected 403 for Viewer contract access, got {viewer_access.status_code}"

    print("  [OK] Changing contract ID by unauthorized users blocked with 403 Forbidden.")

    # 7. DOCUMENT DOWNLOAD AUTHORIZATION
    print("\n[TEST 7] Original Document Download Authorization...")
    assert client.get(f"/api/v1/contracts/{private_con1_id}/file", headers=mgr1_headers).status_code == 200
    assert client.get(f"/api/v1/contracts/{private_con1_id}/file", headers=mgr2_headers).status_code == 403
    assert client.get(f"/api/v1/contracts/{private_con1_id}/file", headers=viewer_headers).status_code == 403
    print("  [OK] Unauthorized document downloads blocked with 403 Forbidden.")

    # 8. RAG CHAT & HISTORY AUTHORIZATION
    print("\n[TEST 8] RAG Chat & History Authorization...")
    # Manager 1 can chat
    chat_res = client.post(
        f"/api/v1/contracts/{private_con1_id}/chat",
        json={"message": "What is the NDA notice period?"},
        headers=mgr1_headers
    )
    assert chat_res.status_code == 200, f"Manager 1 chat failed: {chat_res.text}"

    # Manager 2 cannot chat with Manager 1's contract
    mgr2_chat = client.post(
        f"/api/v1/contracts/{private_con1_id}/chat",
        json={"message": "Exfiltrate information"},
        headers=mgr2_headers
    )
    assert mgr2_chat.status_code == 403, f"Expected 403 for unauthorized chat, got {mgr2_chat.status_code}"

    # Viewer cannot access Manager 1's chat history
    assert client.get(f"/api/v1/contracts/{private_con1_id}/chat", headers=viewer_headers).status_code == 403
    print("  [OK] Vector RAG chat & chat history authorized strictly at contract level.")

    # 9. CONTRACT DELETION RBAC
    print("\n[TEST 9] Contract Deletion Authorization...")
    # Viewer cannot delete
    assert client.delete(f"/api/v1/contracts/{private_con1_id}", headers=viewer_headers).status_code == 403
    # Manager 2 cannot delete Manager 1's contract
    assert client.delete(f"/api/v1/contracts/{private_con1_id}", headers=mgr2_headers).status_code == 403
    # Manager 1 can delete own contract
    assert client.delete(f"/api/v1/contracts/{private_con1_id}", headers=mgr1_headers).status_code == 200
    print("  [OK] Contract deletion authorized for owner/admin only.")

    # 10. VERIFY PHASE 1 & PHASE 2 REGRESSION SAFETY
    print("\n[TEST 10] Running OCR (Phase 1) & Validation (Phase 2) Regression Suite...")
    verify_phase1()
    verify_phase2()

    print("  [OK] Existing OCR, contract validation, and vector RAG pipelines fully operational.")

    db.close()
    print("\n==================================================")
    print("   ALL PHASE 3 SECURITY & AUTH TESTS PASSED 100%   ")
    print("==================================================")

if __name__ == "__main__":
    run_phase3_verification()
