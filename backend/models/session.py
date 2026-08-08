"""
Pydantic models for interview sessions, messages, and debrief.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Any

from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class InterviewMode(str, Enum):
    technical = "technical"
    hr = "hr"
    company = "company"


class Difficulty(str, Enum):
    junior = "junior"
    mid = "mid"
    senior = "senior"


# ── Message (stored in MongoDB & sent to Groq) ────────────────────────────────

class MessageModel(BaseModel):
    """A single turn in the interview conversation."""
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── API Request / Response schemas ────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    """POST /api/session/start"""
    mode: InterviewMode
    company: str | None = None          # Used when mode == "company"
    difficulty: Difficulty = Difficulty.mid


class SessionStartResponse(BaseModel):
    """Response from POST /api/session/start"""
    session_id: str
    first_question: str


class RespondRequest(BaseModel):
    """POST /api/respond"""
    session_id: str
    user_answer: str


class RespondResponse(BaseModel):
    """Response from POST /api/respond"""
    session_id: str
    ai_response: str


class SessionEndRequest(BaseModel):
    """POST /api/session/end"""
    session_id: str


class DebriefResult(BaseModel):
    """Response from POST /api/session/end"""
    session_id: str
    overall_score: int                  # 0–100
    strong_areas: list[str]
    weak_areas: list[str]
    improvement_tips: list[str]


# ── MongoDB document shape (for reference) ────────────────────────────────────

class SessionDocument(BaseModel):
    """Full session document stored in MongoDB."""
    session_id: str
    mode: InterviewMode
    company: str | None = None
    difficulty: Difficulty
    messages: list[MessageModel] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None
    debrief: dict[str, Any] | None = None
