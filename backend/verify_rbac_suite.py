import os
import sys
import uuid
import shutil
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

from app.main import app, init_db
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import User, UserRole, Contract, Clause, RiskIndicator, ChatMessage, Notification
from app.core.security import hash_password, create_access_token

def run_rbac_suite():
    print("=" * 60)
    print("      CONTRACTIQ ROLE-BASED ACCESS CONTROL (RBAC) SUITE      ")
    print("=" * 60)

    init_db()
    client = TestClient(app)
    db = SessionLocal()

    tag = uuid.uuid4().hex[:6]
    admin_email = f"suite_admin_{tag}@contractiq.com"
    manager_email = f"suite_mgr_{tag}@contractiq.com"
    viewer_email = f"suite_viewer_{tag}@contractiq.com"
    pwd = "SecurePassword123!"

    admin_user = User(
        email=admin_email,
        full_name="Suite Admin",
        hashed_password=hash_password(pwd),
        role=UserRole.ADMIN.value,
        can_delete=True
    )
    mgr_user = User(
        email=manager_email,
        full_name="Suite Manager",
        hashed_password=hash_password(pwd),
        role=UserRole.CONTRACT_MANAGER.value,
        can_delete=False
    )
    viewer_user = User(
        email=viewer_email,
        full_name="Suite Viewer",
        hashed_password=hash_password(pwd),
        role=UserRole.VIEWER.value,
        can_delete=False
    )
    db.add_all([admin_user, mgr_user, viewer_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(mgr_user)
    db.refresh(viewer_user)

    # 1. Existing login & token generation continues to work
    print("\n[VERIFY 8.1] Testing Login for all 3 roles...")
    admin_login = client.post("/api/v1/auth/login", json={"email": admin_email, "password": pwd})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    mgr_login = client.post("/api/v1/auth/login", json={"email": manager_email, "password": pwd})
    assert mgr_login.status_code == 200, f"Manager login failed: {mgr_login.text}"
    mgr_token = mgr_login.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    viewer_login = client.post("/api/v1/auth/login", json={"email": viewer_email, "password": pwd})
    assert viewer_login.status_code == 200, f"Viewer login failed: {viewer_login.text}"
    viewer_token = viewer_login.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    print("  [OK] Login succeeded for Admin, Contract Manager, and Viewer.")

    # 2. Prevent Privilege Escalation
    print("\n[VERIFY 6] Testing Privilege Escalation Prevention...")
    # Attempt to self-assign ADMIN role during registration
    res_esc = client.post("/api/v1/auth/register", json={
        "email": f"hacker_{tag}@evil.com",
        "password": "Password123!",
        "full_name": "Privilege Escalator",
        "role": "ADMIN"
    })
    assert res_esc.status_code == 403, f"Expected 403 for self-assigned ADMIN, got {res_esc.status_code}"
    print("  [OK] Registration with role='ADMIN' is rejected with HTTP 403 Forbidden.")

    # Non-admin attempting to change role via endpoint
    res_mod_role = client.patch(
        f"/api/v1/auth/users/{mgr_user.id}/role",
        headers=mgr_headers,
        json={"role": "ADMIN"}
    )
    assert res_mod_role.status_code == 403, f"Expected 403 when non-admin updates role, got {res_mod_role.status_code}"
    print("  [OK] Non-admin cannot modify user roles (HTTP 403 Forbidden).")

    # Admin CAN update role
    res_admin_update = client.patch(
        f"/api/v1/auth/users/{viewer_user.id}/role",
        headers=admin_headers,
        json={"role": "VIEWER"}
    )
    assert res_admin_update.status_code == 200, f"Admin role update failed: {res_admin_update.text}"
    print("  [OK] Administrator can manage roles.")

    # 3. Viewer cannot upload, edit, or delete contracts
    print("\n[VERIFY 3] Testing Viewer restrictions (Upload, Edit, Delete)...")
    # Viewer upload attempt
    sample_file = ("viewer_contract.txt", b"This is an Agreement between Party A and Party B. Payment terms: 30 days. Termination: 60 days.")
    res_v_upload = client.post(
        "/api/v1/contracts/upload",
        headers=viewer_headers,
        files={"file": sample_file}
    )
    assert res_v_upload.status_code == 403, f"Expected 403 for Viewer upload, got {res_v_upload.status_code}"
    print("  [OK] Viewer cannot upload contracts (HTTP 403 Forbidden).")

    # 4. Manager uploads a contract
    print("\n[VERIFY 8.2] Manager uploads contract...")
    contract_text = """MASTER SERVICES AGREEMENT
This Master Services Agreement is entered into between Acme Solutions Inc. ("Customer") and CloudVendor Ltd. ("Vendor").
1. TERM AND TERMINATION
This Agreement commences on January 1, 2025 and continues for two (2) years. Either party may terminate with 30 days written notice.
2. PAYMENT TERMS
Invoices shall be payable within Net 45 days. Late payments shall incur a 1.5% monthly penalty.
3. LIMITATION OF LIABILITY
Neither party shall be liable for indirect or consequential damages.
"""
    from unittest.mock import patch
    with patch("app.api.v1.contracts.classify_document_text", return_value={"is_contract": True, "detected_type": "Master Services Agreement"}), \
         patch("app.api.v1.contracts.analyze_contract_text", return_value={
             "contractType": "Master Services Agreement",
             "company": "CloudVendor Ltd",
             "status": "Active",
             "riskLevel": "Low",
             "paymentTerms": "Net 45 days",
             "clauses": ["Clause 1: Term and Termination", "Clause 2: Payment Terms"],
             "riskIndicators": ["Standard liability disclaimer"]
         }), \
         patch("app.api.v1.contracts.VectorStore.add_chunks", return_value=True):
        res_m_upload = client.post(
            "/api/v1/contracts/upload",
            headers=mgr_headers,
            files={"file": ("acme_agreement.txt", contract_text.encode("utf-8"))},
            data={"company": "CloudVendor Ltd", "contract_name": "Acme Cloud Master Agreement"}
        )
    assert res_m_upload.status_code == 200, f"Manager upload failed: {res_m_upload.text}"
    contract_id = res_m_upload.json()["id"]
    print(f"  [OK] Manager uploaded contract successfully: {contract_id}")

    # Add dummy notification and chat message to test referential integrity & isolation
    db.add(Notification(
        contract_id=contract_id,
        title="Renewal Notice",
        description="Contract renewal due soon",
        alert_type="renewal",
        is_read=False
    ))
    db.add(ChatMessage(
        contract_id=contract_id,
        user_id=mgr_user.id,
        role="user",
        text="What are the payment terms?"
    ))
    db.commit()

    # Viewer edit attempt
    res_v_edit = client.patch(
        f"/api/v1/contracts/{contract_id}",
        headers=viewer_headers,
        json={"name": "Tampered Name"}
    )
    assert res_v_edit.status_code == 403, f"Expected 403 for Viewer edit, got {res_v_edit.status_code}"
    print("  [OK] Viewer cannot edit contract metadata (HTTP 403 Forbidden).")

    # Viewer delete attempt
    res_v_del = client.delete(
        f"/api/v1/contracts/{contract_id}",
        headers=viewer_headers
    )
    assert res_v_del.status_code == 403, f"Expected 403 for Viewer delete, got {res_v_del.status_code}"
    print("  [OK] Viewer cannot delete contracts (HTTP 403 Forbidden).")

    # Manager CAN edit their own contract metadata
    res_m_edit = client.patch(
        f"/api/v1/contracts/{contract_id}",
        headers=mgr_headers,
        json={"paymentTerms": "Net 60 Days"}
    )
    assert res_m_edit.status_code == 200, f"Manager metadata edit failed: {res_m_edit.text}"
    print("  [OK] Contract Manager can edit metadata of their own contract.")

    # 5. Contract Manager cannot delete a contract by default
    print("\n[VERIFY 2] Testing Contract Manager Deletion Restriction...")
    res_m_del = client.delete(
        f"/api/v1/contracts/{contract_id}",
        headers=mgr_headers
    )
    assert res_m_del.status_code == 403, f"Expected 403 for default Manager delete, got {res_m_del.status_code}"
    print("  [OK] Contract Manager cannot delete contract by default (HTTP 403 Forbidden).")

    # 6. Direct API requests & cross-user access isolation
    print("\n[VERIFY 4 & 5] Testing Direct API Bypass & Data Isolation...")
    # Unauthenticated delete attempt
    res_anon_del = client.delete(f"/api/v1/contracts/{contract_id}")
    assert res_anon_del.status_code == 401, f"Expected 401 for unauthenticated delete, got {res_anon_del.status_code}"
    print("  [OK] Direct unauthenticated DELETE returns HTTP 401.")

    # Other non-owner manager attempting to access manager1's private contract
    other_mgr_login = client.post("/api/v1/auth/register", json={
        "email": f"other_mgr_{tag}@contractiq.com",
        "password": "Password123!",
        "full_name": "Other Manager"
    })
    other_mgr_token = create_access_token({"sub": other_mgr_login.json()["id"], "role": "CONTRACT_MANAGER"})
    other_mgr_headers = {"Authorization": f"Bearer {other_mgr_token}"}

    # Other manager cannot access private contract details or file
    res_other_get = client.get(f"/api/v1/contracts/{contract_id}", headers=other_mgr_headers)
    assert res_other_get.status_code == 403, f"Expected 403 for non-owner manager, got {res_other_get.status_code}"
    print("  [OK] Non-authorized user cannot access another user's contract (HTTP 403 Forbidden).")

    res_other_file = client.get(f"/api/v1/contracts/{contract_id}/file", headers=other_mgr_headers)
    assert res_other_file.status_code == 403, f"Expected 403 for non-owner file download, got {res_other_file.status_code}"
    print("  [OK] Non-authorized user cannot download contract file (HTTP 403 Forbidden).")

    # Other manager cannot access chat history
    res_other_chat = client.get(f"/api/v1/contracts/{contract_id}/chat", headers=other_mgr_headers)
    assert res_other_chat.status_code == 403, f"Expected 403 for non-authorized chat history, got {res_other_chat.status_code}"
    print("  [OK] Non-authorized user cannot access contract chat history (HTTP 403 Forbidden).")

    # 7. Admin can delete a contract & verify safe transactional cleanup
    print("\n[VERIFY 1 & 7] Testing Admin Deletion and Referential Integrity...")
    # Check related entities exist prior to deletion
    clauses_before = db.query(Clause).filter(Clause.contract_id == contract_id).count()
    notifs_before = db.query(Notification).filter(Notification.contract_id == contract_id).count()
    chat_before = db.query(ChatMessage).filter(ChatMessage.contract_id == contract_id).count()
    print(f"  Pre-delete: {clauses_before} clauses, {notifs_before} notifications, {chat_before} chat messages.")

    res_admin_del = client.delete(
        f"/api/v1/contracts/{contract_id}",
        headers=admin_headers
    )
    assert res_admin_del.status_code == 200, f"Admin delete failed: {res_admin_del.text}"
    print("  [OK] Administrator successfully deleted contract (HTTP 200 OK).")

    # Verify contract is gone
    deleted_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    assert deleted_contract is None, "Contract still exists in database!"

    # Verify child relations were cleaned up cleanly via cascade
    clauses_after = db.query(Clause).filter(Clause.contract_id == contract_id).count()
    notifs_after = db.query(Notification).filter(Notification.contract_id == contract_id).count()
    chat_after = db.query(ChatMessage).filter(ChatMessage.contract_id == contract_id).count()
    assert clauses_after == 0, f"Clauses orphan leak: {clauses_after} remaining"
    assert notifs_after == 0, f"Notifications orphan leak: {notifs_after} remaining"
    assert chat_after == 0, f"Chat messages orphan leak: {chat_after} remaining"
    print("  [OK] Cascading referential integrity preserved: all clauses, notifications, and chat records safely deleted.")

    # 8. Notifications and Chat endpoints continue to function
    print("\n[VERIFY 8.3] Testing Chat & Notification Endpoints...")
    notif_res = client.get("/api/v1/notifications", headers=admin_headers)
    assert notif_res.status_code == 200, f"Notifications fetch failed: {notif_res.text}"
    print("  [OK] Notifications endpoint functions correctly.")

    chat_res = client.get("/api/v1/contracts/general/chat", headers=admin_headers)
    assert chat_res.status_code == 200, f"General chat fetch failed: {chat_res.text}"
    print("  [OK] Contract assistant chat functions correctly.")

    print("\n" + "=" * 60)
    print("  ALL 8 RBAC & CONTRACT DELETION VERIFICATION CHECKS PASSED!  ")
    print("=" * 60)

if __name__ == "__main__":
    run_rbac_suite()
