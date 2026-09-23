import re
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted contract text.
    """
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def chunk_contract_text(text: str, chunk_size: int = 400, overlap: int = 80) -> List[Dict[str, Any]]:
    """
    Splits contract text into overlapping semantic chunks with page number tracking.
    """
    if not text or not text.strip():
        return []

    # Check if text contains page headers like --- Page X ---
    pages = re.split(r"--- Page (\d+) ---", text)
    
    chunks = []
    chunk_index = 0

    if len(pages) > 1:
        # We have page markers
        current_page = 1
        for i in range(1, len(pages), 2):
            try:
                page_num = int(pages[i])
            except ValueError:
                page_num = current_page
            page_text = clean_text(pages[i+1]) if i+1 < len(pages) else ""
            if not page_text:
                continue

            paras = [p.strip() for p in page_text.split("\n\n") if p.strip()]
            current_chunk = []
            current_length = 0

            for para in paras:
                words = para.split()
                if current_length + len(words) > chunk_size and current_chunk:
                    chunks.append({
                        "chunk_id": chunk_index,
                        "page_number": page_num,
                        "text": " ".join(current_chunk),
                        "word_count": len(current_chunk)
                    })
                    chunk_index += 1
                    current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else []
                    current_length = len(current_chunk)

                current_chunk.extend(words)
                current_length += len(words)

            if current_chunk:
                chunks.append({
                    "chunk_id": chunk_index,
                    "page_number": page_num,
                    "text": " ".join(current_chunk),
                    "word_count": len(current_chunk)
                })
                chunk_index += 1
    else:
        # Plain text without page markers
        cleaned = clean_text(text)
        paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            words = para.split()
            if current_length + len(words) > chunk_size and current_chunk:
                chunks.append({
                    "chunk_id": chunk_index,
                    "page_number": 1,
                    "text": " ".join(current_chunk),
                    "word_count": len(current_chunk)
                })
                chunk_index += 1
                current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else []
                current_length = len(current_chunk)

            current_chunk.extend(words)
            current_length += len(words)

        if current_chunk:
            chunks.append({
                "chunk_id": chunk_index,
                "page_number": 1,
                "text": " ".join(current_chunk),
                "word_count": len(current_chunk)
            })

    return chunks
