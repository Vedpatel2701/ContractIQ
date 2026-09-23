import io
import json
import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_separator(title):
    print(f"\n{'='*25} {title} {'='*25}")

def test_case_b_certificate_rejection():
    print_separator("TEST CASE B: Reject Certificate / Non-Contract")
    
    certificate_content = """
    CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY
    FACULTY OF TECHNOLOGY AND ENGINEERING
    
    MERIT SCHOLARSHIP CERTIFICATE OF EXCELLENCE
    
    This is to certify that Mr. Ved Patel (Student ID: 21IT001)
    has been awarded the Academic Excellence Scholarship for achieving
    a Semester Grade Point Average (SGPA) of 9.85 in B.Tech Information Technology.
    
    Date of Issue: May 15, 2024
    Registrar / Dean of Academic Affairs
    Certificate ID: CHARUSAT-SCH-2024-88412
    """
    
    files = {
        'file': ('scholarship_certificate.txt', io.BytesIO(certificate_content.encode('utf-8')), 'text/plain')
    }
    
    res = requests.post(f"{BASE_URL}/contracts/upload", files=files)
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")
    
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    data = res.json()
    assert "detail" in data
    detail = data["detail"]
    if isinstance(detail, dict):
        assert detail.get("is_contract") is False, "is_contract should be False"
        print(f" Successfully rejected non-contract! Detected type: {detail.get('detected_type')}")
        print(f" Rejection reason: {detail.get('reason')}")
    else:
        print(f" Rejected with detail: {detail}")
    
    # Confirm no contract record was created with this name
    contracts_res = requests.get(f"{BASE_URL}/contracts")
    all_contracts = contracts_res.json()
    if isinstance(all_contracts, dict):
        all_contracts = all_contracts.get("items", [])
    for c in all_contracts:
        assert "scholarship_certificate" not in c.get("file_name", ""), "Contract record was illegally created!"
    print(" Verified: No contract record or database entry created for rejected certificate.")


def test_case_a_and_c_validation_and_rag():
    print_separator("TEST CASE A & C: Valid Contracts & RAG Isolation")
    
    contract_a_text = """
    MUTUAL NON-DISCLOSURE AGREEMENT
    
    This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of October 1, 2025 ("Effective Date"),
    by and between AlphaCorp Inc., a Delaware corporation ("Disclosing Party"), and Beta Solutions LLC ("Receiving Party").
    
    1. Confidential Information
    "Confidential Information" means all non-public, proprietary information, including but not limited to trade secrets,
    source code, customer lists, financial data, and technical specifications disclosed by AlphaCorp to Beta Solutions.
    
    2. Obligations of Receiving Party
    Beta Solutions agrees to protect AlphaCorp's Confidential Information with the highest standard of care and shall not
    disclose it to any third party without prior written consent.
    
    3. Term and Termination
    This Agreement shall remain in effect for a period of two (2) years from the Effective Date.
    Either party may terminate this Agreement by giving thirty (30) days prior written notice.
    
    4. Governing Law
    This Agreement shall be governed by and construed in accordance with the laws of the State of California.
    
    IN WITNESS WHEREOF, the parties have executed this Agreement.
    """
    
    contract_c_text = """
    MASTER CLOUD SOFTWARE SERVICES AGREEMENT
    
    This Master Services Agreement ("Agreement") is made on January 15, 2026,
    between OmegaTech Global Ltd ("Vendor" or "Provider") and Gamma Logistics Inc ("Client").
    
    1. Scope of Services
    OmegaTech agrees to provide enterprise cloud infrastructure management, 99.99% uptime SLA,
    and 24/7 technical support as detailed in Exhibit A.
    
    2. Fees and Invoicing
    Client shall pay OmegaTech a monthly recurring subscription fee of $45,000 USD.
    Payment terms are net 45 days upon receipt of invoice.
    
    3. Service Level Agreement (SLA) & Penalties
    In the event of uptime falling below 99.9%, Vendor shall credit 15% of the monthly fee back to Client.
    
    4. Term and Termination
    This Agreement commences on January 15, 2026 and continues for three (3) years.
    Termination for convenience requires sixty (60) days advance notice.
    
    5. Governing Law and Jurisdiction
    This Agreement is governed by the laws of the State of New York.
    """
    
    # Upload Contract A
    print("\nUploading Contract A (AlphaCorp NDA)...")
    res_a = requests.post(f"{BASE_URL}/contracts/upload", files={
        'file': ('alphacorp_nda.txt', io.BytesIO(contract_a_text.encode('utf-8')), 'text/plain')
    })
    assert res_a.status_code == 201, f"Failed to upload Contract A: {res_a.text}"
    contract_a = res_a.json()
    contract_a_id = contract_a["id"]
    print(f" Contract A created with ID: {contract_a_id}, Title: {contract_a.get('title')}")
    print(f"   Status: {contract_a.get('status')}, Risk: {contract_a.get('risk_level')}")
    
    # Upload Contract C
    print("\nUploading Contract C (OmegaTech Cloud MSA)...")
    res_c = requests.post(f"{BASE_URL}/contracts/upload", files={
        'file': ('omegatech_msa.txt', io.BytesIO(contract_c_text.encode('utf-8')), 'text/plain')
    })
    assert res_c.status_code == 201, f"Failed to upload Contract C: {res_c.text}"
    contract_c = res_c.json()
    contract_c_id = contract_c["id"]
    print(f" Contract C created with ID: {contract_c_id}, Title: {contract_c.get('title')}")
    print(f"   Status: {contract_c.get('status')}, Risk: {contract_c.get('risk_level')}")
    
    print_separator("TEST RAG ACCURACY & ISOLATION")
    
    # 1. Ask Contract A about its own notice period
    print("\n[Query 1] Asking Contract A: 'What is the termination notice period?'")
    chat_a1 = requests.post(f"{BASE_URL}/contracts/{contract_a_id}/chat", json={
        "message": "What is the termination notice period?"
    }).json()
    print(f"Answer: {chat_a1['answer']}")
    print(f"Sources: {[s.get('source_type') for s in chat_a1.get('sources', [])]}")
    assert "30" in chat_a1['answer'] or "thirty" in chat_a1['answer'].lower(), "Failed to get 30 days notice from Contract A"
    
    # 2. Ask Contract A about Contract C's unique content (SLA / OmegaTech / $45,000 monthly fee)
    print("\n[Query 2] Asking Contract A: 'What is the monthly subscription fee and uptime SLA for OmegaTech?'")
    chat_a2 = requests.post(f"{BASE_URL}/contracts/{contract_a_id}/chat", json={
        "message": "What is the monthly subscription fee and uptime SLA for OmegaTech?"
    }).json()
    print(f"Answer: {chat_a2['answer']}")
    # It must state that information is not found in the contract, and NOT leak OmegaTech's $45,000 fee!
    assert "45,000" not in chat_a2['answer'], "LEAKAGE DETECTED! Contract A returned fee from Contract C!"
    assert "couldn't find" in chat_a2['answer'].lower() or "not find" in chat_a2['answer'].lower() or "not specify" in chat_a2['answer'].lower() or "not mentioned" in chat_a2['answer'].lower() or "not found" in chat_a2['answer'].lower()
    print(" Isolation confirmed: Contract A did not leak Contract C's data.")
    
    # 3. Ask Contract A about missing information in Contract A (e.g. payment penalties)
    print("\n[Query 3] Asking Contract A: 'What is the penalty fee for late payment?'")
    chat_a3 = requests.post(f"{BASE_URL}/contracts/{contract_a_id}/chat", json={
        "message": "What is the penalty fee for late payment?"
    }).json()
    print(f"Answer: {chat_a3['answer']}")
    assert "couldn't find" in chat_a3['answer'].lower() or "not find" in chat_a3['answer'].lower() or "not specify" in chat_a3['answer'].lower() or "not mentioned" in chat_a3['answer'].lower() or "not found" in chat_a3['answer'].lower()
    print(" Unanswered questions handling confirmed: Answered with 'couldn't find' without hallucinating.")
    
    # 4. Ask Contract C about its SLA penalties
    print("\n[Query 4] Asking Contract C: 'What is the penalty if uptime falls below 99.9%?'")
    chat_c1 = requests.post(f"{BASE_URL}/contracts/{contract_c_id}/chat", json={
        "message": "What is the penalty if uptime falls below 99.9%?"
    }).json()
    print(f"Answer: {chat_c1['answer']}")
    print(f"Sources: {chat_c1.get('sources', [])}")
    assert "15%" in chat_c1['answer'], "Failed to get 15% penalty from Contract C"
    
    # Verify Source metadata fidelity
    for src in chat_c1.get('sources', []):
        assert src.get('contract_id') == contract_c_id, "Source contract_id does not match!"
        print(f" Verified source: {src.get('source_type')} - Contract ID: {src.get('contract_id')}")

if __name__ == "__main__":
    try:
        test_case_b_certificate_rejection()
        test_case_a_and_c_validation_and_rag()
        print_separator("ALL TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
