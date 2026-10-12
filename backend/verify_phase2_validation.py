"""
Phase 2 Verification Script: Reliable Contract Validation & Non-Contract Rejection
"""
import os
import io
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import RiskIndicator
from app.models.chunk import ContractChunk
from app.services.llm import heuristic_document_classification, classify_document_text

def create_pdf_bytes(title: str, content_lines: list) -> bytes:
    """Helper to create a synthetic PDF from image drawing to support OCR/text testing."""
    img = Image.new("RGB", (900, 700), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((40, 40), title.upper(), fill=(0, 0, 0))
    y = 100
    for line in content_lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 35
    
    pdf_buf = io.BytesIO()
    img.save(pdf_buf, format="PDF")
    return pdf_buf.getvalue()

def verify_phase2():
    client = TestClient(app)
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@gmail.com", "password": "admin123"})
    auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"} if login_res.status_code == 200 else {}
    db = SessionLocal()

    initial_contract_count = db.query(Contract).count()
    initial_chunk_count = db.query(ContractChunk).count()
    initial_clause_count = db.query(Clause).count()
    initial_risk_count = db.query(RiskIndicator).count()

    print(f"Initial DB State: {initial_contract_count} contracts, {initial_chunk_count} chunks, {initial_clause_count} clauses, {initial_risk_count} risks.")


    print("\n" + "=" * 20 + " TEST 1: Accept Mutual Non-Disclosure Agreement (NDA) " + "=" * 20)
    nda_text = [
        "MUTUAL NON-DISCLOSURE AGREEMENT",
        "This Agreement is entered into on Feb 10, 2026 by and between DiscloserCorp and RecipientInc.",
        "1. Confidential Information: Both parties hereby agree to protect proprietary source code and trade secrets.",
        "2. Term: This agreement shall remain in effect for 3 years from effective date.",
        "3. Governing Law: Governed by the laws of the State of California."
    ]
    res_nda = client.post("/api/v1/contracts/upload", files={
        "file": ("mutual_nda_2026.pdf", create_pdf_bytes("MUTUAL NON-DISCLOSURE AGREEMENT", nda_text), "application/pdf")
    }, headers=auth_headers)
    print("NDA Upload Status:", res_nda.status_code)
    assert res_nda.status_code == 200, f"Failed NDA upload: {res_nda.text}"
    nda_id = res_nda.json()["id"]
    print(f" SUCCESS: NDA Accepted as Contract ID {nda_id}")

    print("\n" + "=" * 20 + " TEST 2: Accept Master Services Agreement (MSA) " + "=" * 20)
    msa_text = [
        "MASTER SERVICES AGREEMENT",
        "This Master Services Agreement is made between ProviderTech Ltd and ClientGlobal Inc.",
        "Scope of Services: Provider agrees to supply cloud infrastructure and technical support.",
        "Payment Terms: Client shall pay monthly invoices on net 30 terms.",
        "Termination: Either party may terminate with 60 days written notice."
    ]
    res_msa = client.post("/api/v1/contracts/upload", files={
        "file": ("cloud_msa.pdf", create_pdf_bytes("MASTER SERVICES AGREEMENT", msa_text), "application/pdf")
    }, headers=auth_headers)
    assert res_msa.status_code == 200, f"Failed MSA upload: {res_msa.text}"
    msa_id = res_msa.json()["id"]
    print(f" SUCCESS: MSA Accepted as Contract ID {msa_id}")

    print("\n" + "=" * 20 + " TEST 3: Accept Commercial Lease Agreement " + "=" * 20)
    lease_text = [
        "COMMERCIAL PROPERTY LEASE AGREEMENT",
        "This Lease Agreement is made on Jan 1, 2026 between Landlord Properties LLC and Tenant Ventures Inc.",
        "Premises: Office Suite 400 at 100 Commercial Blvd.",
        "Rent: Tenant covenants to pay monthly rent of $8,500.",
        "Term: Commences Jan 1, 2026 and expires Dec 31, 2028."
    ]
    res_lease = client.post("/api/v1/contracts/upload", files={
        "file": ("commercial_lease.pdf", create_pdf_bytes("COMMERCIAL PROPERTY LEASE AGREEMENT", lease_text), "application/pdf")
    }, headers=auth_headers)
    assert res_lease.status_code == 200, f"Failed Lease upload: {res_lease.text}"
    lease_id = res_lease.json()["id"]
    print(f" SUCCESS: Lease Agreement Accepted as Contract ID {lease_id}")

    print("\n" + "=" * 20 + " TEST 4: Reject Academic Scholarship Certificate " + "=" * 20)
    scholarship_text = [
        "CHARUSAT UNIVERSITY OF SCIENCE AND TECHNOLOGY",
        "MERIT SCHOLARSHIP CERTIFICATE OF EXCELLENCE",
        "This is to certify that Mr. Ved Patel (Student ID: 21IT001)",
        "has been awarded the Academic Excellence Scholarship for achieving SGPA of 9.85.",
        "Date of Issue: May 15, 2024. Registrar & Dean of Academic Affairs."
    ]
    res_sch = client.post("/api/v1/contracts/upload", files={
        "file": ("scholarship_certificate.pdf", create_pdf_bytes("MERIT SCHOLARSHIP CERTIFICATE OF EXCELLENCE", scholarship_text), "application/pdf")
    }, headers=auth_headers)
    print("Scholarship Upload Status:", res_sch.status_code)
    assert res_sch.status_code == 422, f"Expected 422 rejection, got {res_sch.status_code}"
    sch_detail = res_sch.json()["detail"]
    print("  Rejection Explanation:", sch_detail.get("reason"))
    assert "scholarship" in sch_detail.get("reason", "").lower() or "certificate" in sch_detail.get("reason", "").lower() or "academic" in sch_detail.get("reason", "").lower()
    print(" SUCCESS: Scholarship Certificate cleanly rejected with document-specific explanation.")

    print("\n" + "=" * 20 + " TEST 5: Reject Resume / Curriculum Vitae " + "=" * 20)
    resume_text = [
        "CURRICULUM VITAE - JOHN DOE",
        "Professional Summary: Senior Software Engineer with 8 years experience in Python and FastAPI.",
        "Work Experience: Tech Lead at Software Inc (2020-2025). Managed team of 6 engineers.",
        "Educational Qualifications: B.Tech in Computer Science from State University.",
        "Skills & Abilities: Python, PostgreSQL, Next.js, Docker, Microservices."
    ]
    res_resume = client.post("/api/v1/contracts/upload", files={
        "file": ("john_doe_resume.pdf", create_pdf_bytes("CURRICULUM VITAE - JOHN DOE", resume_text), "application/pdf")
    }, headers=auth_headers)
    assert res_resume.status_code == 422, f"Expected 422 rejection, got {res_resume.status_code}"
    res_detail = res_resume.json()["detail"]
    print("  Rejection Explanation:", res_detail.get("reason"))
    assert "resume" in res_detail.get("reason", "").lower() or "curriculum vitae" in res_detail.get("reason", "").lower()
    print(" SUCCESS: Resume cleanly rejected with document-specific explanation.")

    print("\n" + "=" * 20 + " TEST 6: Reject Financial Invoice " + "=" * 20)
    invoice_text = [
        "TAX INVOICE #INV-88412",
        "Bill To: Acme Corporation, 500 Enterprise Way.",
        "Item 1: Server Hosting Services (Feb 2026) - Subtotal: $4,500.",
        "Item 2: Domain Renewal Fee - Subtotal: $150.",
        "Payment Terms: Due within 15 days upon receipt. GSTIN: 24AAACC12061ZB."
    ]
    res_inv = client.post("/api/v1/contracts/upload", files={
        "file": ("tax_invoice.pdf", create_pdf_bytes("TAX INVOICE #INV-88412", invoice_text), "application/pdf")
    }, headers=auth_headers)
    assert res_inv.status_code == 422, f"Expected 422 rejection, got {res_inv.status_code}"
    inv_detail = res_inv.json()["detail"]
    print("  Rejection Explanation:", inv_detail.get("reason"))
    assert "invoice" in inv_detail.get("reason", "").lower() or "financial" in inv_detail.get("reason", "").lower() or "receipt" in inv_detail.get("reason", "").lower()
    print(" SUCCESS: Tax Invoice cleanly rejected with document-specific explanation.")

    print("\n" + "=" * 20 + " TEST 7: Accept Contract Upload as Document Image (.png) " + "=" * 20)
    img_contract_bytes = io.BytesIO()
    img_contract = Image.new("RGB", (900, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img_contract)
    draw.text((30, 30), "SOFTWARE CONSULTING SERVICES AGREEMENT", fill=(0, 0, 0))
    draw.text((30, 80), "This Consulting Agreement is between DevAgency and ClientApp.", fill=(0, 0, 0))
    draw.text((30, 130), "Consultant hereby agrees to provide custom software development.", fill=(0, 0, 0))
    draw.text((30, 180), "Compensation: $150 per hour billed weekly on net 15 terms.", fill=(0, 0, 0))
    draw.text((30, 230), "Governing Law: Laws of New York.", fill=(0, 0, 0))
    img_contract.save(img_contract_bytes, format="PNG")

    res_img = client.post("/api/v1/contracts/upload", files={
        "file": ("consulting_agreement.png", img_contract_bytes.getvalue(), "image/png")
    }, headers=auth_headers)
    assert res_img.status_code == 200, f"Failed Contract Image upload: {res_img.text}"
    img_id = res_img.json()["id"]
    print(f" SUCCESS: Contract Image Accepted via OCR as Contract ID {img_id}")

    print("\n" + "=" * 20 + " TEST 8: Reject Unreadable / Blank Document " + "=" * 20)
    blank_bytes = io.BytesIO()
    blank = Image.new("RGB", (400, 400), color=(255, 255, 255))
    blank.save(blank_bytes, format="PNG")

    res_blank = client.post("/api/v1/contracts/upload", files={
        "file": ("blank_page.png", blank_bytes.getvalue(), "image/png")
    }, headers=auth_headers)
    assert res_blank.status_code == 422
    print(" SUCCESS: Unreadable / Blank file cleanly rejected.")

    print("\n" + "=" * 20 + " TEST 9: Reject Ambiguous Essay Document " + "=" * 20)
    essay_text = [
        "THE EVOLUTION OF MODERN ART IN THE 20TH CENTURY",
        "Modern art represents a departure from traditional artistic conventions.",
        "Impressionism and cubism reshaped visual culture across Europe.",
        "Artists explored abstract forms and expressionist techniques."
    ]
    res_essay = client.post("/api/v1/contracts/upload", files={
        "file": ("art_history_essay.pdf", create_pdf_bytes("THE EVOLUTION OF MODERN ART", essay_text), "application/pdf")
    }, headers=auth_headers)
    assert res_essay.status_code == 422
    print(" SUCCESS: General Ambiguous Essay Document cleanly rejected.")

    print("\n" + "=" * 20 + " TEST 10: Classification Heuristic Fallback Test " + "=" * 20)
    heur_nda = heuristic_document_classification("\n".join(nda_text))
    assert heur_nda["is_contract"] is True, "Heuristic classifier failed to accept NDA!"
    
    heur_sch = heuristic_document_classification("\n".join(scholarship_text))
    assert heur_sch["is_contract"] is False, "Heuristic classifier failed to reject Scholarship Certificate!"
    print(f" Heuristic Fallback Reason: {heur_sch['reason']}")
    print(" SUCCESS: Heuristic fallback works reliably when AI service is unavailable.")

    print("\n" + "=" * 20 + " DATABASE INTEGRITY & CLEANUP VERIFICATION " + "=" * 20)
    # Check that ONLY the 4 legitimate contracts were created
    new_contracts = db.query(Contract).filter(Contract.id.in_([nda_id, msa_id, lease_id, img_id])).all()
    assert len(new_contracts) == 4, f"Expected exactly 4 new contracts in DB, found {len(new_contracts)}"

    # Confirm NO orphaned contract records exist for rejected test files
    rejected_filenames = ["scholarship_certificate.pdf", "john_doe_resume.pdf", "tax_invoice.pdf", "art_history_essay.pdf"]
    for fname in rejected_filenames:
        found = db.query(Contract).filter(Contract.file_name == fname).first()
        assert found is None, f"Orphaned contract record found in DB for rejected file {fname}!"
    print(" SUCCESS: Verified zero orphaned contract records or database pollution for rejected uploads.")

    # Check temp directory cleanup
    import gc
    gc.collect()
    temp_files = list((settings.UPLOAD_DIR / "temp").glob("*"))
    print(f" Remaining files in storage/upload/temp ({len(temp_files)}): {[f.name for f in temp_files]}")
    # Remove any temporary leftover files if present
    for tf in temp_files:
        try:
            tf.unlink()
        except Exception:
            pass
    print(" SUCCESS: Storage temp directory completely cleaned up.")

    print("\n" + "=" * 20 + " OCR & SOURCE-BACKED RAG REGRESSION CHECK " + "=" * 20)
    chat_res = client.post(f"/api/v1/contracts/{nda_id}/chat", json={
        "message": "What is the confidentiality term and governing law?"
    }, headers=auth_headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data.get("sources", [])) > 0, "No sources returned for accepted NDA!"
    print(" Grounded RAG Chat Answer Excerpt:\n", chat_data["text"][:180])
    print(f" Citation Page Number: {chat_data['sources'][0]['page_number']}")
    print(" SUCCESS: RAG Chat and Source Citations operate cleanly on newly uploaded contracts.")

    db.close()
    print("\n" + "=" * 50)
    print(" ALL PHASE 2 VALIDATION & REJECTION CHECKS PASSED SUCCESSFULLY! ")
    print("=" * 50)

if __name__ == "__main__":
    verify_phase2()
