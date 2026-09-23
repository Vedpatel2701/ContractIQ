import os
from pathlib import Path
from pypdf import PdfReader
from docx import Document
from app.services.ocr import extract_text_from_image

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from PDF, DOCX, TXT, or Image files.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()
    
    if suffix == ".pdf":
        return extract_from_pdf(file_path)
    elif suffix in [".docx", ".doc"]:
        return extract_from_docx(file_path)
    elif suffix in [".txt", ".rtf", ".md"]:
        return extract_from_text(file_path)
    elif suffix in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
        return extract_text_from_image(file_path)
    else:
        # Fallback raw read
        return extract_from_text(file_path)

def extract_from_pdf(pdf_path: str) -> str:
    try:
        reader = PdfReader(pdf_path)
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                extracted_pages.append(f"--- Page {i+1} ---\n{text.strip()}")
        
        full_text = "\n\n".join(extracted_pages)
        if not full_text.strip():
            # If standard extraction returned nothing, attempt OCR fallback
            return extract_text_from_image(pdf_path)
        return full_text
    except Exception as e:
        print(f"[PDF Extraction Error] {e}")
        return ""

def extract_from_docx(docx_path: str) -> str:
    try:
        doc = Document(docx_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        print(f"[DOCX Extraction Error] {e}")
        return ""

def extract_from_text(text_path: str) -> str:
    try:
        with open(text_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"[Text Read Error] {e}")
        return ""
