import logging
import os
import shutil
from pathlib import Path
from typing import Union, Optional
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)

_resolved_tesseract_cmd: Optional[str] = None
_ocr_warning_logged: bool = False


def get_tesseract_cmd() -> Optional[str]:
    """
    Resolves the Tesseract binary across environments (Windows, Linux Docker/Render, macOS).
    Priority:
    1. settings.TESSERACT_CMD (if set, non-empty, and executable exists on disk)
    2. System PATH (via shutil.which("tesseract"))
    3. Standard Linux binaries: /usr/bin/tesseract, /usr/local/bin/tesseract
    4. Standard Windows install locations
    """
    global _resolved_tesseract_cmd, _ocr_warning_logged

    if _resolved_tesseract_cmd is not None:
        return _resolved_tesseract_cmd if _resolved_tesseract_cmd != "" else None

    # 1. Check configured setting if provided
    configured = getattr(settings, "TESSERACT_CMD", None)
    if configured and os.path.isfile(configured):
        _resolved_tesseract_cmd = configured
        return _resolved_tesseract_cmd

    # 2. Check system PATH
    which_path = shutil.which("tesseract")
    if which_path and os.path.isfile(which_path):
        _resolved_tesseract_cmd = which_path
        return _resolved_tesseract_cmd

    # 3. Check common Linux paths (Docker Debian/Ubuntu, Render)
    for linux_path in ("/usr/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract-ocr"):
        if os.path.isfile(linux_path):
            _resolved_tesseract_cmd = linux_path
            return _resolved_tesseract_cmd

    # 4. Check common Windows paths
    for win_path in (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ):
        if os.path.isfile(win_path):
            _resolved_tesseract_cmd = win_path
            return _resolved_tesseract_cmd

    # Tesseract not found
    _resolved_tesseract_cmd = ""
    if not _ocr_warning_logged:
        logger.warning(
            "[OCR Warning] Tesseract OCR binary not found. Scanned document text extraction "
            "will be skipped gracefully. Install Tesseract OCR or set TESSERACT_CMD to enable."
        )
        _ocr_warning_logged = True
    return None


def is_ocr_available() -> bool:
    """Returns True if pytesseract and an actual Tesseract engine binary are available."""
    try:
        import pytesseract  # noqa: F401
        return get_tesseract_cmd() is not None
    except ImportError:
        return False


def extract_text_from_image(image_input: Union[str, Path, Image.Image]) -> str:
    """
    Extracts text from an image file path or PIL Image object using Tesseract OCR with graceful fallback.
    Does not crash if Tesseract is missing; logs a clear warning instead.
    """
    tesseract_cmd = get_tesseract_cmd()
    if not tesseract_cmd:
        logger.warning("[OCR Notice] Skipping image OCR: Tesseract engine binary is not available.")
        return ""

    try:
        import pytesseract

        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        should_close = False
        if isinstance(image_input, (str, Path)):
            image = Image.open(image_input)
            should_close = True
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            logger.warning(f"[OCR Warning] Invalid image input type: {type(image_input)}")
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
        logger.warning(f"[OCR Notice] Image OCR extraction encountered an error: {e}")
        return ""
