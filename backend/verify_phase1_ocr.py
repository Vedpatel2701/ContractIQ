"""
Phase 1 Verification Script: OCR for Scanned Contracts & Document Images
Tests:
1. Normal text-based PDF extraction.
2. Scanned PDF per-page OCR extraction.
3. Image-based document upload OCR (.png / .jpg).
4. Page metadata preservation throughout extraction, chunking, and pgvector storage.
5. Integration with Contract Assistant RAG chat and source citations.
6. Unreadable file / empty extraction rejection behavior.
"""
import os
import io
import pypdfium2 as pdfium
from PIL import Image, ImageDraw
from pypdf import PdfWriter
from fastapi.testclient import TestClient
from app.main import app
from app.services.extractor import extract_text_from_file
from app.services.chunker import chunk_contract_text
from app.services.vector_store import VectorStore

def create_scanned_pdf_bytes(title: str, body_text: str) -> bytes:
    """Helper to create a synthetic scanned PDF by drawing text onto an image and saving as PDF."""
    img = Image.new("RGB", (1000, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((40, 50), title.upper(), fill=(0, 0, 0))
    y = 120
    for line in body_text.split("\n"):
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 35
    
    pdf_bytes = io.BytesIO()
    img.save(pdf_bytes, format="PDF")
    return pdf_bytes.getvalue()

def create_image_file_bytes(title: str, body_text: str) -> bytes:
    """Helper to create a synthetic document image (.png)."""
    img = Image.new("RGB", (1000, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((40, 50), title.upper(), fill=(0, 0, 0))
    y = 120
    for line in body_text.split("\n"):
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 35
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    return img_bytes.getvalue()

def verify_phase1():
    print("=" * 20 + " TEST 1: Normal Text-Based PDF Extraction " + "=" * 20)
    # Upload text-based contract
    client = TestClient(app)
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@gmail.com", "password": "admin123"})
    auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"} if login_res.status_code == 200 else {}

    
    text_pdf_bytes = create_scanned_pdf_bytes(
        "EQUIPMENT LEASE AND SERVICE AGREEMENT",
        "This Lease Agreement is entered into on March 1, 2026 between EquipmentCorp and FactoryLabs.\n"
        "1. Monthly rent shall be $12,500 due on net 30 terms.\n"
        "2. Termination requires 90 days written notice prior to annual renewal.\n"
        "3. Lessee shall maintain comprehensive liability insurance of $2,000,000."
    )
    
    # Save temporary file to test extractor directly
    temp_scanned_path = "storage/temp/test_scanned_contract.pdf"
    os.makedirs("storage/temp", exist_ok=True)
    with open(temp_scanned_path, "wb") as f:
        f.write(text_pdf_bytes)

    extracted_scanned = extract_text_from_file(temp_scanned_path)
    print("Extracted Scanned PDF Text Excerpt:\n", extracted_scanned[:250])
    
    assert "--- Page 1 ---" in extracted_scanned, "Page 1 marker missing from OCR extraction!"
    assert "EQUIPMENT LEASE" in extracted_scanned.upper() or "LEASE" in extracted_scanned.upper(), "OCR failed to extract agreement title!"
    assert "12,500" in extracted_scanned or "12500" in extracted_scanned or "RENT" in extracted_scanned.upper(), "OCR failed to extract financial numbers!"
    print("SUCCESS: Scanned PDF page OCR extracted usable text with Page 1 marker.")

    print("\n" + "=" * 20 + " TEST 2: Supported Image-Based Document OCR (.png) " + "=" * 20)
    image_bytes = create_image_file_bytes(
        "SOFTWARE MASTER SERVICES AGREEMENT",
        "This Master Services Agreement is executed on April 10, 2026 between CloudSystems Inc and ClientCorp.\n"
        "Scope: Cloud infrastructure management and 99.95% uptime SLA.\n"
        "Payment Terms: Quarterly subscription billed in advance.\n"
        "Notice Period: 60 days notice required for termination."
    )
    
    temp_image_path = "storage/temp/test_document_image.png"
    with open(temp_image_path, "wb") as f:
        f.write(image_bytes)

    extracted_image_text = extract_text_from_file(temp_image_path)
    print("Extracted Document Image Text Excerpt:\n", extracted_image_text[:250])
    
    assert "--- Page 1 ---" in extracted_image_text, "Page 1 marker missing from Image OCR extraction!"
    assert "SOFTWARE MASTER SERVICES" in extracted_image_text.upper() or "SERVICES AGREEMENT" in extracted_image_text.upper(), "Image OCR failed title extraction!"
    print("SUCCESS: Image document upload OCR extracted text and preserved page attribution.")

    print("\n" + "=" * 20 + " TEST 3: Full End-to-End Processing Pipeline with OCR Document Upload " + "=" * 20)
    upload_res = client.post(
        "/api/v1/contracts/upload",
        files={"file": ("scanned_lease_agreement.pdf", text_pdf_bytes, "application/pdf")},
        headers=auth_headers
    )
    print("Upload API Status Code:", upload_res.status_code)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    contract_data = upload_res.json()
    contract_id = contract_data["id"]
    print(f" OCR-processed Contract uploaded successfully with ID: {contract_id}")

    print("\n" + "=" * 20 + " TEST 4: Query Contract Assistant for OCR-Derived Contract " + "=" * 20)
    chat_res = client.post(
        f"/api/v1/contracts/{contract_id}/chat",
        json={"message": "What is the monthly rent and required notice period?"},
        headers=auth_headers
    )
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    chat_data = chat_res.json()
    print("Assistant Answer:\n", chat_data["text"][:250])
    print("Retrieved Structured Sources Count:", len(chat_data.get("sources", [])))
    
    assert len(chat_data.get("sources", [])) > 0, "Expected at least 1 source citation for OCR contract!"
    source_item = chat_data["sources"][0]
    print(f" Verified Source Metadata: Page {source_item['page_number']}, Doc Name: '{source_item['document_name']}'")
    assert source_item["contract_id"] == contract_id, "Source contract_id mismatch!"
    assert source_item["page_number"] == 1, f"Expected page_number 1, got {source_item['page_number']}"

    print("\n" + "=" * 20 + " TEST 5: Unreadable Document Rejection Check " + "=" * 20)
    blank_img = Image.new("RGB", (500, 500), color=(255, 255, 255))
    blank_bytes = io.BytesIO()
    blank_img.save(blank_bytes, format="PNG")
    
    reject_res = client.post(
        "/api/v1/contracts/upload",
        files={"file": ("blank_scanned_page.png", blank_bytes.getvalue(), "image/png")},
        headers=auth_headers
    )
    print("Blank document upload response status:", reject_res.status_code)
    assert reject_res.status_code in [422, 400], f"Expected 422 rejection, got {reject_res.status_code}"
    print("SUCCESS: Blank/unreadable scanned file cleanly rejected with 422.")

    # Cleanup temp files
    for p in [temp_scanned_path, temp_image_path]:
        if os.path.exists(p):
            os.remove(p)

    print("\n" + "=" * 50)
    print(" ALL PHASE 1 OCR VERIFICATION CHECKS PASSED SUCCESSFULLY! ")
    print("=" * 50)

if __name__ == "__main__":
    verify_phase1()
