"""
RAG service — ChromaDB vector store + sentence-transformers embeddings.

Lifecycle:
  init_rag()        → called once at app startup; loads KB files, embeds, upserts into ChromaDB
  query_company()   → called per-request for company mode; returns top-k relevant chunks

Embedding model : sentence-transformers/all-MiniLM-L6-v2  (384-dim, fast, good quality)
Vector store    : ChromaDB  (local persistent store at ./chroma_db/)
Collection      : "company_kb"
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy-loaded module-level singletons
_chroma_client = None
_collection = None
_ef = None          # Embedding function

KB_DIR = Path(__file__).parent.parent / "kb"
CHROMA_PATH = Path(__file__).parent.parent / "chroma_db"
COLLECTION_NAME = "company_kb"
EMBED_MODEL = "all-MiniLM-L6-v2"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_collection():
    """Return the ChromaDB collection, initialising lazily if needed."""
    global _chroma_client, _collection, _ef
    if _collection is not None:
        return _collection

    import chromadb
    from chromadb.utils import embedding_functions

    _chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    _ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )
    _collection = _chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_ef,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def _chunk_company_doc(data: dict) -> list[tuple[str, str]]:
    """
    Break a company JSON doc into semantic text chunks suitable for embedding.
    Returns list of (chunk_id, chunk_text) tuples.
    """
    company = data["company"].lower()
    chunks = []

    # Chunk 1 — interview style overview
    chunks.append((
        f"{company}__style",
        f"Company: {company.title()}. Interview style: {data.get('interview_style', '')}",
    ))

    # Chunk 2 — focus areas (joined)
    if data.get("focus_areas"):
        focus_text = "; ".join(data["focus_areas"])
        chunks.append((
            f"{company}__focus",
            f"Company: {company.title()}. Key focus areas: {focus_text}",
        ))

    # Chunk 3 — culture notes
    if data.get("culture_notes"):
        chunks.append((
            f"{company}__culture",
            f"Company: {company.title()}. Culture and values: {data['culture_notes']}",
        ))

    # Chunk 4 — common questions (batched in groups of 4 to stay within token limits)
    questions = data.get("common_questions", [])
    for i in range(0, len(questions), 4):
        batch = questions[i : i + 4]
        q_text = " | ".join(batch)
        chunks.append((
            f"{company}__questions_{i}",
            f"Company: {company.title()}. Typical interview questions: {q_text}",
        ))

    return chunks


# ── Public API ────────────────────────────────────────────────────────────────

async def init_rag() -> None:
    """
    Load all KB JSON files, embed each chunk, and upsert into ChromaDB.
    Idempotent — re-running updates existing chunks rather than duplicating them.
    Called from app lifespan on startup.
    """
    if not KB_DIR.exists():
        logger.warning("[RAG] KB directory not found at %s — skipping RAG init.", KB_DIR)
        return

    kb_files = list(KB_DIR.glob("*.json"))
    if not kb_files:
        logger.warning("[RAG] No JSON files found in %s — skipping RAG init.", KB_DIR)
        return

    logger.info("[RAG] Initialising ChromaDB from %d KB files…", len(kb_files))

    try:
        col = _get_collection()
    except Exception as exc:
        logger.error("[RAG] Failed to initialise ChromaDB: %s", exc)
        return

    all_ids: list[str] = []
    all_docs: list[str] = []
    all_meta: list[dict] = []

    for kb_file in kb_files:
        try:
            data = json.loads(kb_file.read_text(encoding="utf-8"))
            company = data.get("company", kb_file.stem).lower()
            chunks = _chunk_company_doc(data)

            for chunk_id, chunk_text in chunks:
                all_ids.append(chunk_id)
                all_docs.append(chunk_text)
                all_meta.append({"company": company, "source": kb_file.name})

            logger.info("[RAG]   ✓ Loaded %s (%d chunks)", kb_file.name, len(chunks))

        except Exception as exc:
            logger.error("[RAG]   ✗ Failed to load %s: %s", kb_file.name, exc)

    if all_ids:
        # Upsert is idempotent — safe to call on every startup
        col.upsert(ids=all_ids, documents=all_docs, metadatas=all_meta)
        logger.info("[RAG] ✓ ChromaDB upserted %d chunks total.", len(all_ids))
    else:
        logger.warning("[RAG] No chunks to upsert.")


def query_company(company_name: str, n_results: int = 3) -> list[str]:
    """
    Query ChromaDB for the top-n most relevant chunks for a given company.

    Args:
        company_name : The target company (e.g. "google", "Amazon").
        n_results    : Number of chunks to retrieve (default 3).

    Returns:
        List of chunk text strings, or [] if RAG is unavailable.
    """
    if not company_name:
        return []

    try:
        col = _get_collection()
    except Exception as exc:
        logger.warning("[RAG] ChromaDB unavailable for query: %s", exc)
        return []

    # First try: filter by company metadata for precision
    company_key = company_name.strip().lower()
    try:
        results = col.query(
            query_texts=[f"Interview preparation for {company_name}"],
            n_results=n_results,
            where={"company": company_key},
        )
        docs = results.get("documents", [[]])[0]
        if docs:
            return docs
    except Exception:
        pass  # Fall through to unfiltered search

    # Fallback: semantic search without company filter
    try:
        results = col.query(
            query_texts=[f"Interview preparation for {company_name}"],
            n_results=n_results,
        )
        return results.get("documents", [[]])[0]
    except Exception as exc:
        logger.warning("[RAG] Query failed: %s", exc)
        return []
