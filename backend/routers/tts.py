"""
TTS router — ElevenLabs text-to-speech synthesis.

Endpoints (all placeholder — no API calls yet):
  POST /api/tts/synthesize → Convert text to speech via ElevenLabs
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(prefix="/tts", tags=["tts"])


# ── Request schema ────────────────────────────────────────────────────────────

class SynthesizeRequest(BaseModel):
    text: str
    voice_id: str | None = None  # Override default voice


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/synthesize", response_model=dict)
async def synthesize(body: SynthesizeRequest):
    """
    Send text to ElevenLabs API and return an audio URL or base64 blob.

    TODO:
    - Call ElevenLabs /v1/text-to-speech/{voice_id} with body.text
    - Stream or return audio bytes as a response
    - Optionally store audio in object storage and return URL
    """
    return JSONResponse(
        status_code=501,
        content={
            "message": "TTS synthesis logic not yet implemented.",
            "text_received": body.text,
        },
    )
