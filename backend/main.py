"""
Dossier Backend — FastAPI Application Entry Point
"""

from dotenv import load_dotenv
load_dotenv()

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print(f"Groq key loaded: {os.getenv('GROQ_API_KEY')[:8]}...")

from db.client import connect_db, close_db
from routers import sessions, interview, tts
from routers.session_engine import router as engine_router
from services.rag_service import init_rag
from config import settings


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hooks."""
    await connect_db()
    await init_rag()       # Embed & index KB files into ChromaDB
    yield
    await close_db()


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Dossier API",
    description="AI-powered interview coaching backend — powered by Groq (llama-3.1-70b-versatile).",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

# Core interview engine (Groq-powered) — owns /api/session/* and /api/respond
app.include_router(engine_router)

# Legacy / supplementary routers
app.include_router(sessions.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(tts.router, prefix="/api")


# ── Audio Transcription Endpoint ──────────────────────────────────────────────

@app.post("/api/transcribe", tags=["audio"])
async def transcribe_audio(file: UploadFile = File(...)):
    ext = ".webm"
    if file.filename and "." in file.filename:
        ext = f".{file.filename.split('.')[-1]}"
    temp_filename = f"temp_audio{ext}"
    try:
        content = await file.read()
        with open(temp_filename, "wb") as f:
            f.write(content)

        file_size = os.path.getsize(temp_filename)
        print(f"Audio file received: {file_size} bytes")

        if file_size < 1000:
            return {"transcript": "", "error": "Audio too short or empty"}

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable not set")

        with open(temp_filename, "rb") as f:
            transcription = groq_client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
                response_format="text"
            )

        text_result = transcription.text if hasattr(transcription, "text") else str(transcription)
        print(f"Whisper transcript: '{text_result}'")
        return {"transcript": text_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    """Liveness probe — returns 200 when the service is up."""
    return {"status": "ok", "version": settings.APP_VERSION}
