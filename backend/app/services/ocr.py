import os
from pathlib import Path
from PIL import Image
from app.core.config import settings

def extract_text_from_image(image_path: str) -> str:
    """
    Extracts text from an image file using OCR with graceful fallback.
    """
    try:
        import pytesseract
        if os.path.exists(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            
        image = Image.open(image_path)
        gray = image.convert("L")
        text = pytesseract.image_to_string(gray)
        return text.strip()
    except Exception as e:
        print(f"[OCR Notice] Image OCR not available or failed: {e}")
        return ""
