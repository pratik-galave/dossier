"""
Legacy sessions router — kept for backwards compatibility.
Core interview logic now lives in routers/session_engine.py.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/sessions", tags=["sessions-legacy"])


@router.get("/{session_id}", response_model=dict)
async def get_session(session_id: str):
    """Retrieve basic session info."""
    return {"session_id": session_id, "note": "Use /api/session/start to create sessions."}
