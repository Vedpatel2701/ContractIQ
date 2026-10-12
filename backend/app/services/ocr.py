import os
from pathlib import Path
from typing import Union
from PIL import Image
from app.core.config import settings

def extract_text_from_image(image_input: Union[str, Path, Image.Image]) -> str:
    """
    Extracts text from an image file path or PIL Image object using Tesseract OCR with graceful fallback.
    """
    try:
        import pytesseract

        # Configure Tesseract binary path if configured
        if hasattr(settings, "TESSERACT_CMD") and settings.TESSERACT_CMD and os.path.exists(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        should_close = False
        if isinstance(image_input, (str, Path)):
            image = Image.open(image_input)
            should_close = True
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            print(f"[OCR Warning] Invalid image input type: {type(image_input)}")
            return ""

        try:
            # Pre-process image: convert to grayscale for optimal OCR readability
            gray = image.convert("L")
            text = pytesseract.image_to_string(gray)
            return text.strip()
        finally:
            if should_close:
                try:
                    image.close()
                except Exception:
                    pass
    except Exception as e:
        print(f"[OCR Notice] Image OCR not available or failed: {e}")
        return ""
