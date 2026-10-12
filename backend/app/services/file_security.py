import os
import re
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException
from pypdf import PdfReader
from docx import Document
from PIL import Image

# Allowed extensions
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".txt", ".rtf", ".md",
    ".png", ".jpg", ".jpeg", ".tiff", ".bmp"
}

# Maximum upload size: 25 MB
MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filename against path traversal and dangerous characters.
    """
    if not filename:
        return "unnamed_document.pdf"
    
    # Strip directory components (e.g., ../ or ..\)
    base_name = Path(filename).name
    # Keep only alphanumeric, dashes, dots, underscores, and spaces
    clean_name = re.sub(r'[^a-zA-Z0-9_\.\- ]', '_', base_name).strip()
    if not clean_name or clean_name.startswith('.'):
        clean_name = f"document_{clean_name.lstrip('.')}"
    return clean_name or "uploaded_contract.pdf"

def validate_file_security(file_path: Path, filename: str) -> Tuple[bool, str]:
    """
    Validates file extension, size, and actual binary magic bytes.
    Detects malformed, corrupted, empty, or unreadable files before extraction.
    Raises HTTPException(400, 413, or 422) on failure.
    """
    if not file_path.exists():
        raise HTTPException(
            status_code=400,
            detail={"is_contract": False, "detected_type": "Missing File", "reason": "Uploaded file could not be located."}
        )

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "is_contract": False,
                "detected_type": "Empty Document",
                "reason": "The uploaded file is empty (0 bytes). Please upload a valid document.",
                "message": "Document rejected: File is empty."
            }
        )

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "is_contract": False,
                "detected_type": "Oversized File",
                "reason": f"File size ({round(file_size / (1024*1024), 2)}MB) exceeds maximum limit of 25MB.",
                "message": "File exceeds maximum allowed upload size of 25MB."
            }
        )

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail={
                "is_contract": False,
                "detected_type": "Unsupported File Type",
                "reason": f"File format '{ext}' is not supported. Supported formats: PDF, DOCX, TXT, RTF, MD, PNG, JPG, BMP, TIFF.",
                "message": f"Unsupported file type: {ext}"
            }
        )

    # Magic Bytes & Content Inspection
    with open(file_path, "rb") as f:
        header = f.read(1024)

    if ext == ".pdf":
        if b"%PDF-" not in header[:1024]:
            raise HTTPException(
                status_code=422,
                detail={
                    "is_contract": False,
                    "detected_type": "Corrupted or Invalid PDF",
                    "reason": "File does not contain valid PDF header magic bytes (%PDF-). It may be corrupted or disguised as a PDF.",
                    "message": "Invalid PDF file structure."
                }
            )
        try:
            reader = PdfReader(str(file_path))
            if len(reader.pages) == 0:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "is_contract": False,
                        "detected_type": "Empty PDF Document",
                        "reason": "The PDF document contains 0 pages.",
                        "message": "PDF contains no pages."
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail={
                    "is_contract": False,
                    "detected_type": "Corrupted PDF",
                    "reason": f"The PDF file is malformed or corrupted: {str(e)[:150]}",
                    "message": "Malformed or unreadable PDF document."
                }
            )

    elif ext in [".docx", ".doc"]:
        if ext == ".docx":
            if not header.startswith(b"PK\x03\x04"):
                raise HTTPException(
                    status_code=422,
                    detail={
                        "is_contract": False,
                        "detected_type": "Invalid DOCX File",
                        "reason": "File lacks Word DOCX zip container header (PK). It may be corrupted or renamed.",
                        "message": "Invalid DOCX file signature."
                    }
                )
            try:
                Document(str(file_path))
            except Exception as e:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "is_contract": False,
                        "detected_type": "Corrupted DOCX",
                        "reason": f"The Word document could not be read: {str(e)[:150]}",
                        "message": "Corrupted or unreadable Word document."
                    }
                )

    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
        # Verify valid image header
        valid_img = False
        if ext == ".png" and header.startswith(b"\x89PNG\r\n\x1a\n"):
            valid_img = True
        elif ext in [".jpg", ".jpeg"] and header.startswith(b"\xff\xd8\xff"):
            valid_img = True
        elif ext == ".bmp" and header.startswith(b"BM"):
            valid_img = True
        elif ext == ".tiff" and (header.startswith(b"II*\x00") or header.startswith(b"MM\x00*")):
            valid_img = True

        if not valid_img:
            raise HTTPException(
                status_code=422,
                detail={
                    "is_contract": False,
                    "detected_type": "Corrupted Image Header",
                    "reason": f"File signature does not match expected {ext.upper()} image format.",
                    "message": "Invalid image file header."
                }
            )

        try:
            with Image.open(str(file_path)) as img:
                img.verify()
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail={
                    "is_contract": False,
                    "detected_type": "Corrupted Image",
                    "reason": f"Image file is corrupted or unreadable: {str(e)[:150]}",
                    "message": "Corrupted image file."
                }
            )

    elif ext in [".txt", ".md", ".rtf"]:
        # Text files should not contain binary null bytes (\x00)
        if b"\x00" in header:
            raise HTTPException(
                status_code=422,
                detail={
                    "is_contract": False,
                    "detected_type": "Binary Disguised as Text",
                    "reason": "The file contains binary null bytes and is not valid plain text.",
                    "message": "Binary content detected in text file."
                }
            )

    return True, ext
