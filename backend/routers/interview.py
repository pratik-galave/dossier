"""
Interview router — AI question generation and conversation management.

Endpoints (all placeholder — no AI logic yet):
  POST /api/interview/message   → Send a user message and get AI response
  POST /api/interview/start     → Generate the first question for a session
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/interview", tags=["interview"])


# ── Request / Response schemas ────────────────────────────────────────────────

class MessageRequest(BaseModel):
    session_id: str
    user_text: str


class StartRequest(BaseModel):
    session_id: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/message", response_model=dict)
async def send_message(body: MessageRequest):
    """
    Accept a user answer, pass it (with history) to Claude, and return
    the AI follow-up question or acknowledgement.

    TODO:
    - Retrieve session + message history from MongoDB
    - Call Anthropic Claude API with system prompt + history
    - Append both user message and AI response to session messages
    - Return AI text for display and TTS synthesis
    """
    return {
        "session_id": body.session_id,
        "ai_text": "Interview message logic not yet implemented.",
        "is_follow_up": False,
        "question_number": 1,
    }


@router.post("/respond", response_model=dict)
async def respond_to_transcript(body: dict):
    """
    Accept voice transcript or text input, return AI response.
    """
    transcript = body.get("transcript") or body.get("user_text") or body.get("text") or ""
    session_id = body.get("session_id", "session-1")

    ai_response = (
        f"Thank you for sharing that. Building on what you said about '{transcript}', "
        "how would you evaluate the trade-offs of this solution in a high-scale production system?"
    ) if transcript else (
        "Could you elaborate a bit more on your approach?"
    )

    return {
        "session_id": session_id,
        "response": ai_response,
        "ai_text": ai_response,
        "status": "success"
    }



@router.post("/start", response_model=dict)
async def start_interview(body: StartRequest):
    """
    Generate the opening question for the session based on mode/difficulty.

    TODO:
    - Retrieve session config from MongoDB
    - Build Claude system prompt based on mode, difficulty, JD
    - Call Claude to get the first question
    - Persist initial AI message to session
    """
    return {
        "session_id": body.session_id,
        "ai_text": "Interview start logic not yet implemented.",
        "question_number": 1,
    }
