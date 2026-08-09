"""
RAG service — pure stdlib, no external vector DB or embedding libraries.

Lifecycle:
  init_rag()      → called once at app startup; loads all KB JSON files from /kb/
                    into an in-memory dict keyed by lowercase company name.
  query_company() → called per-request for company mode; fuzzy-matches the
                    requested company name and returns a structured context string.

No chromadb, no sentence-transformers, no additional packages required.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

KB_DIR = Path(__file__).parent.parent / "kb"

# In-memory store: { "amazon": { ...json data }, "google": { ...}, ... }
_kb: dict[str, dict] = {}


# ── Startup ───────────────────────────────────────────────────────────────────

async def init_rag() -> None:
    """
    Load all JSON files from /kb/ into the in-memory knowledge base.
    Called once from the FastAPI lifespan at startup.
    Idempotent — safe to call multiple times.
    """
    global _kb
    _kb = {}

    if not KB_DIR.exists():
        logger.warning("[RAG] KB directory not found at %s — no company data loaded.", KB_DIR)
        return

    kb_files = sorted(KB_DIR.glob("*.json"))
    if not kb_files:
        logger.warning("[RAG] No JSON files found in %s.", KB_DIR)
        return

    for kb_file in kb_files:
        try:
            data: dict = json.loads(kb_file.read_text(encoding="utf-8"))
            # Key by the 'company' field if present, otherwise use the filename stem
            key = data.get("company", kb_file.stem).strip().lower()
            _kb[key] = data
            logger.info("[RAG] ✓ Loaded %s (key=%r)", kb_file.name, key)
        except Exception as exc:
            logger.error("[RAG] ✗ Failed to load %s: %s", kb_file.name, exc)

    logger.info("[RAG] Loaded %d company KB entries: %s", len(_kb), sorted(_kb.keys()))


# ── Fuzzy matching (stdlib only) ──────────────────────────────────────────────

def _best_match(query: str) -> str | None:
    """
    Find the best matching company key in _kb for a given query string.

    Strategy (in order of preference):
      1. Exact lowercase match
      2. Query is a substring of a key  (e.g. "ubs" matches "ubs")
      3. A key is a substring of the query (e.g. "amazon web services" → "amazon")
      4. Shared characters / token overlap score
    Returns the best key or None if no reasonable match found.
    """
    if not _kb or not query:
        return None

    q = query.strip().lower()

    # 1. Exact match
    if q in _kb:
        return q

    # 2. Query contains a kb key as a whole word / substring
    for key in _kb:
        if key in q:
            return key

    # 3. A kb key starts with the query or vice-versa
    for key in _kb:
        if key.startswith(q) or q.startswith(key):
            return key

    # 4. Token overlap score
    q_tokens = set(q.split())
    best_key: str | None = None
    best_score = 0
    for key in _kb:
        key_tokens = set(key.split())
        overlap = len(q_tokens & key_tokens)
        if overlap > best_score:
            best_score = overlap
            best_key = key

    return best_key if best_score > 0 else None


# ── Public API ────────────────────────────────────────────────────────────────

def query_company(company_name: str, n_results: int = 3) -> list[str]:
    """
    Return a list of context strings for the given company.

    This replaces the old ChromaDB-based implementation.
    The return type is kept as list[str] so session_engine.py needs no changes.

    Returns a single-element list with a richly formatted context block,
    or an empty list if the company is not found in the KB.
    """
    if not company_name:
        return []

    matched_key = _best_match(company_name)

    if matched_key is None:
        logger.info("[RAG] No KB match for company=%r — using generic mode.", company_name)
        return [
            f"No specific interview data found for '{company_name}'. "
            "Use general software engineering / behavioural interview patterns."
        ]

    data = _kb[matched_key]
    logger.info("[RAG] Matched company=%r to key=%r", company_name, matched_key)

    # Build structured context strings (one per chunk, mirrors old API shape)
    chunks: list[str] = []

    # Chunk 1 — interview style
    interview_style = data.get("interview_style", "")
    if interview_style:
        chunks.append(
            f"Interview style at {data.get('company', matched_key).title()}: {interview_style}"
        )

    # Chunk 2 — focus areas (joined)
    focus_areas: list[str] = data.get("focus_areas", [])
    if focus_areas:
        chunks.append(
            f"Key focus areas: {'; '.join(focus_areas)}"
        )

    # Chunk 3 — first n_results common questions
    common_questions: list[str] = data.get("common_questions", [])
    if common_questions:
        top_qs = common_questions[:n_results]
        chunks.append(
            "Common interview questions: " + " | ".join(top_qs)
        )

    # Chunk 4 — culture notes
    culture_notes = data.get("culture_notes", "")
    if culture_notes:
        chunks.append(f"Culture & values: {culture_notes}")

    return chunks if chunks else []


def build_company_context_string(company_name: str) -> str:
    """
    Build the full structured context string injected into the system prompt.
    Returns a formatted block or a fallback message.
    """
    if not company_name:
        return ""

    matched_key = _best_match(company_name)
    company_title = company_name.title()

    if matched_key is None:
        return (
            f"No specific data for {company_title} in the knowledge base. "
            "Use general interview patterns."
        )

    data = _kb[matched_key]
    company_title = data.get("company", matched_key).title()

    focus_areas: list[str] = data.get("focus_areas", [])
    interview_style: str = data.get("interview_style", "Standard multi-round interviews.")
    common_questions: list[str] = data.get("common_questions", [])
    culture_notes: str = data.get("culture_notes", "")

    lines: list[str] = [
        f"This candidate is preparing for an interview at {company_title}.",
        f"Known interview patterns: {'; '.join(focus_areas)}" if focus_areas else "",
        f"Interview style: {interview_style}" if interview_style else "",
        "Common topics: " + " | ".join(common_questions[:3]) if common_questions else "",
        f"Culture notes: {culture_notes}" if culture_notes else "",
        "Ask questions aligned with these patterns.",
    ]

    return "\n".join(line for line in lines if line)
