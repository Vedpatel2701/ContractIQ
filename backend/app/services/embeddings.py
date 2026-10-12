"""
Embedding Service for ContractIQ.
Generates real vector embeddings using Gemini API (models/gemini-embedding-001)
or fastembed (BAAI/bge-small-en-v1.5) as local fallback.
"""
from typing import List, Optional
import numpy as np
from app.core.config import settings

_fastembed_model = None

def get_fastembed_model():
    global _fastembed_model
    if _fastembed_model is None:
        try:
            from fastembed import TextEmbedding
            _fastembed_model = TextEmbedding("BAAI/bge-small-en-v1.5")
        except Exception as e:
            print(f"[Embedding Service] FastEmbed init failed: {e}")
            _fastembed_model = False
    return _fastembed_model if _fastembed_model else None

def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Generates a normalized floating point embedding vector for text.
    """
    if not text or not text.strip():
        return None

    # 1. Try Gemini Embedding API first
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            res = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=text[:8000]
            )
            if res and hasattr(res, "embeddings") and res.embeddings:
                vec = res.embeddings[0].values
                # Normalize vector
                arr = np.array(vec, dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                return arr.tolist()
        except Exception as e:
            print(f"[Gemini Embedding Warning]: {e}")

    # 2. Local FastEmbed fallback
    fast_model = get_fastembed_model()
    if fast_model:
        try:
            embeddings_generator = fast_model.embed([text[:2000]])
            vec = list(embeddings_generator)[0]
            arr = np.array(vec, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()
        except Exception as e:
            print(f"[FastEmbed Warning]: {e}")

    return None

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two vector lists."""
    if not v1 or not v2:
        return 0.0
    a1 = np.array(v1, dtype=np.float32)
    a2 = np.array(v2, dtype=np.float32)
    norm1 = np.linalg.norm(a1)
    norm2 = np.linalg.norm(a2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(a1, a2) / (norm1 * norm2))
