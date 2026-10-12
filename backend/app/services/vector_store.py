import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.chunk import ContractChunk
from app.services.embeddings import generate_embedding, cosine_similarity

STOP_WORDS = {"a", "an", "the", "in", "on", "of", "for", "to", "and", "is", "are", "what", "which", "how", "when", "where", "who", "whom", "this", "that", "it"}

class VectorStore:
    def __init__(self, contract_id: str):
        self.contract_id = contract_id
        self.index_file = settings.VECTOR_INDEX_DIR / f"{contract_id}_index.json"
        self.chunks: List[Dict[str, Any]] = []
        self._load_json_index()

    def _load_json_index(self):
        """Loads JSON vector index from disk as local fallback."""
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            except Exception as e:
                print(f"[VectorStore JSON Load Error for {self.contract_id}] {e}")
                self.chunks = []

    def _save_json_index(self):
        """Saves JSON vector index to disk as local fallback."""
        try:
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, indent=2)
        except Exception as e:
            print(f"[VectorStore JSON Save Error for {self.contract_id}] {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]], db: Optional[Session] = None):
        """
        Indexes text chunks both in PostgreSQL contract_chunks table (with real vector embeddings)
        and in local JSON storage. Strictly isolated by contract_id.
        """
        for i, c in enumerate(chunks):
            c["contract_id"] = self.contract_id
            if "chunk_id" not in c:
                c["chunk_id"] = i

        self.chunks = chunks
        self._save_json_index()

        # Save to PostgreSQL with real vector embeddings
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            # Delete existing chunks for this contract to prevent duplicates
            db.query(ContractChunk).filter(ContractChunk.contract_id == self.contract_id).delete()
            
            pg_chunks = []
            for i, c in enumerate(chunks):
                chunk_text = c.get("text", "")
                emb = generate_embedding(chunk_text)
                
                pg_c = ContractChunk(
                    contract_id=self.contract_id,
                    chunk_index=c.get("chunk_id", i),
                    text=chunk_text,
                    page_number=c.get("page_number", 1),
                    section=c.get("section"),
                    embedding=emb
                )
                pg_chunks.append(pg_c)
            
            db.add_all(pg_chunks)
            db.commit()
            print(f"[VectorStore PG] Stored {len(pg_chunks)} vector chunks for contract {self.contract_id} in PostgreSQL.")
        except Exception as e:
            db.rollback()
            print(f"[VectorStore PG Error for {self.contract_id}] {e}")
        finally:
            if close_db:
                db.close()

    def search(self, query: str, top_k: int = 4, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Performs similarity search strictly within this contract's chunks.
        First tries PostgreSQL vector similarity search.
        If vector search returns no matches or is unavailable, falls back to keyword matching.
        """
        # 1. Try PostgreSQL Vector Cosine Similarity Search
        pg_results = self._search_postgresql_vector(query, top_k, db)
        if pg_results:
            return pg_results

        # 2. Fallback: Keyword Overlap Search (JSON / In-memory)
        return self._search_keyword_fallback(query, top_k)

    def _search_postgresql_vector(self, query: str, top_k: int, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Queries PostgreSQL for contract_chunks filtered by contract_id using Cosine Similarity."""
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            query_emb = generate_embedding(query)
            if not query_emb:
                return []

            # Retrieve only chunks belonging to this contract_id
            db_chunks = db.query(ContractChunk).filter(
                ContractChunk.contract_id == self.contract_id,
                ContractChunk.embedding.isnot(None)
            ).all()

            if not db_chunks:
                return []

            scored_chunks = []
            for c in db_chunks:
                sim = cosine_similarity(query_emb, c.embedding)
                if sim > 0.15: # Similarity threshold
                    scored_chunks.append((sim, {
                        "contract_id": c.contract_id,
                        "chunk_id": c.chunk_index,
                        "text": c.text,
                        "page_number": c.page_number,
                        "section": c.section,
                        "score": round(sim, 4)
                    }))

            scored_chunks.sort(key=lambda x: x[0], reverse=True)
            results = [item[1] for item in scored_chunks[:top_k]]
            if results:
                print(f"[VectorStore PG Search] Retained top {len(results)} vector matches for contract {self.contract_id}.")
            return results
        except Exception as e:
            print(f"[VectorStore PG Search Error for {self.contract_id}] {e}")
            return []
        finally:
            if close_db:
                db.close()

    def _search_keyword_fallback(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback keyword overlap search."""
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
            for term in query_terms:
                if term in chunk_text:
                    score += 2

            clean_q = " ".join(query_terms)
            if clean_q and clean_q in chunk_text:
                score += 5

            if score > 0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:top_k]]
