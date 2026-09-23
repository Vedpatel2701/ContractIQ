import os
import shutil
import hashlib
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

def save_uploaded_file(file: UploadFile, contract_id: str) -> tuple[str, str, int]:
    """
    Saves an uploaded file to the structured storage directory.
    Returns: (file_path_str, sanitized_filename, file_size_bytes)
    """
    contract_dir = settings.UPLOAD_DIR / contract_id
    contract_dir.mkdir(parents=True, exist_ok=True)
    
    # Sanitize file name
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ").strip()
    if not safe_filename:
        safe_filename = f"document_{contract_id}.pdf"
        
    dest_path = contract_dir / safe_filename
    
    # Write file content
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(dest_path)
    
    return str(dest_path), safe_filename, file_size
