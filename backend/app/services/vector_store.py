import json
from pathlib import Path
from typing import List, Dict, Any
from app.core.config import settings

STOP_WORDS = {"a", "an", "the", "in", "on", "of", "for", "to", "and", "is", "are", "what", "which", "how", "when", "where", "who", "whom", "this", "that", "it"}

class VectorStore:
    def __init__(self, contract_id: str):
        self.contract_id = contract_id
        self.index_file = settings.VECTOR_INDEX_DIR / f"{contract_id}_index.json"
        self.chunks: List[Dict[str, Any]] = []
        self._load_index()

    def _load_index(self):
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            except Exception as e:
                print(f"[VectorStore Load Error for {self.contract_id}] {e}")
                self.chunks = []

    def _save_index(self):
        try:
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, indent=2)
        except Exception as e:
            print(f"[VectorStore Save Error for {self.contract_id}] {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """Indexes text chunks strictly isolated to this contract ID."""
        for c in chunks:
            c["contract_id"] = self.contract_id
        self.chunks = chunks
        self._save_index()

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Performs similarity search strictly within this contract's chunks.
        Returns only relevant matches with positive overlap score.
        """
        if not self.chunks:
            return []

        raw_terms = query.lower().split()
        query_terms = [t.strip("?,.:;\"'()[]") for t in raw_terms if t.lower() not in STOP_WORDS and len(t) > 1]
        
        if not query_terms:
            query_terms = raw_terms

        scored_chunks = []

        for chunk in self.chunks:
            chunk_text = chunk.get("text", "").lower()
            score = 0

            # Match exact terms
            for term in query_terms:
                if term in chunk_text:
                    score += 2

            # Exact multi-word phrase boost
            clean_q = " ".join(query_terms)
            if clean_q and clean_q in chunk_text:
                score += 5

            if score > 0:
                scored_chunks.append((score, chunk))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:top_k]]
