"""
Session engine router — the core interview engine.

Endpoints:
  POST /api/session/start  → Create session in MongoDB, return first AI question
  POST /api/session/end    → Analyse full transcript, return debrief
  POST /api/respond        → Handle user answer, return AI follow-up via Groq
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db.client import get_db
from models.session import (
    SessionStartRequest,
    SessionStartResponse,
    RespondRequest,
    RespondResponse,
    SessionEndRequest,
    DebriefResult,
)
from services.groq_service import (
    generate_first_question,
    generate_follow_up,
    generate_debrief,
)
from services.rag_service import query_company

logger = logging.getLogger(__name__)
router = APIRouter(tags=["interview-engine"])



# ── Helpers ───────────────────────────────────────────────────────────────────

def _sessions_collection():
    """Return the sessions collection, or None if DB is unavailable."""
    db = get_db()
    if db is None:
        return None
    return db["sessions"]


async def _fetch_session(session_id: str) -> dict:
    """
    Fetch a session document from MongoDB.
    Falls back to an in-memory lookup if MongoDB is unavailable.
    Raises 404 if not found.
    """
    col = _sessions_collection()
    if col is not None:
        doc = await col.find_one({"session_id": session_id})
        if doc:
            return doc

    # Try in-memory store (set by /session/start when DB is down)
    doc = _memory_store.get(session_id)
    if doc:
        return doc

    raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")


async def _save_session(doc: dict) -> None:
    """Upsert a session document to MongoDB (or keep in memory if DB is down)."""
    col = _sessions_collection()
    if col is not None:
        await col.replace_one(
            {"session_id": doc["session_id"]},
            doc,
            upsert=True,
        )
    else:
        _memory_store[doc["session_id"]] = doc


# In-memory fallback when MongoDB is not available (dev / demo mode)
_memory_store: dict[str, dict] = {}


# ── POST /api/session/start ───────────────────────────────────────────────────

@router.post("/api/session/start", response_model=SessionStartResponse, status_code=201)
async def session_start(body: SessionStartRequest):
    """
    Create a new interview session and return the first AI question.

    - Generates a unique session_id
    - Calls Groq (llama-3.1-70b-versatile) to produce the opening question
    - Persists the session document in MongoDB (in-memory fallback if DB is down)
    """
    if not body.mode:
        raise HTTPException(status_code=422, detail="mode is required.")

    # ── RAG: retrieve company context for company mode ─────────────────────
    rag_context: list[str] = []
    if body.mode.value == "company" and body.company:
        rag_context = query_company(body.company, n_results=3)
        if rag_context:
            logger.info(
                "[RAG] Retrieved %d chunks for company '%s'",
                len(rag_context),
                body.company,
            )
        else:
            logger.warning("[RAG] No chunks found for company '%s'", body.company)

    # Generate the first question from Groq
    try:
        first_question = await generate_first_question(
            mode=body.mode.value,
            company=body.company,
            rag_context=rag_context or None,
            difficulty=body.difficulty.value,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error while generating first question: {exc}",
        )

    session_id = str(uuid.uuid4())

    # Build and persist the session document (store rag_context for reuse)
    session_doc = {
        "session_id": session_id,
        "mode": body.mode.value,
        "company": body.company,
        "difficulty": body.difficulty.value,
        "rag_context": rag_context,
        "messages": [
            {
                "role": "assistant",
                "content": first_question,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "debrief": None,
    }

    await _save_session(session_doc)

    return SessionStartResponse(session_id=session_id, first_question=first_question)


# ── POST /api/respond ─────────────────────────────────────────────────────────

@router.post("/api/respond", response_model=RespondResponse)
async def respond(body: RespondRequest):
    """
    Process the candidate's answer and return the AI's next question/comment.

    - Fetches the full session message history from MongoDB
    - Sends history + new user answer to Groq
    - Appends both the user turn and AI response to the session document
    - Returns { session_id, ai_response }
    """
    if not body.user_answer or not body.user_answer.strip():
        raise HTTPException(status_code=422, detail="user_answer must not be empty.")

    # Load session
    session = await _fetch_session(body.session_id)

    # Build Groq-compatible history (role / content dicts only)
    history = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in session.get("messages", [])
    ]

    # Reuse the RAG context stored at session creation
    rag_context = session.get("rag_context") or None

    # Call Groq for follow-up
    try:
        ai_response = await generate_follow_up(
            mode=session["mode"],
            company=session.get("company"),
            history=history,
            user_answer=body.user_answer.strip(),
            rag_context=rag_context,
            difficulty=session.get("difficulty", "medium"),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {exc}",
        )

    # Append both turns to session messages
    now = datetime.now(timezone.utc).isoformat()
    session["messages"].append({"role": "user", "content": body.user_answer.strip(), "timestamp": now})
    session["messages"].append({"role": "assistant", "content": ai_response, "timestamp": now})

    await _save_session(session)

    return RespondResponse(session_id=body.session_id, ai_response=ai_response)


# ── POST /api/session/end ─────────────────────────────────────────────────────

@router.post("/api/session/end", response_model=DebriefResult)
async def session_end(body: SessionEndRequest):
    """
    End the session and return a structured debrief.

    - Fetches the full session transcript from MongoDB
    - Sends the full conversation to Groq for structured analysis
    - Returns: overall_score, strong_areas, weak_areas, improvement_tips
    - Marks the session as ended (ended_at timestamp)
    """
    session = await _fetch_session(body.session_id)

    messages = session.get("messages", [])
    if len(messages) < 2:
        raise HTTPException(
            status_code=422,
            detail="Session has too few messages to generate a debrief.",
        )

    # Build history list for Groq
    history = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in messages
    ]

    # Generate debrief via Groq
    try:
        debrief_data = await generate_debrief(
            mode=session["mode"],
            company=session.get("company"),
            history=history,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error during debrief generation: {exc}",
        )

    # Persist ended state + debrief
    session["ended_at"] = datetime.now(timezone.utc).isoformat()
    session["debrief"] = debrief_data
    await _save_session(session)

    return DebriefResult(
        session_id=body.session_id,
        overall_score=debrief_data.get("overall_score", 50),
        strong_areas=debrief_data.get("strong_areas", []),
        weak_areas=debrief_data.get("weak_areas", []),
        improvement_tips=debrief_data.get("improvement_tips", []),
    )
