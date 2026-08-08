# Dossier Backend — Developer Guide

FastAPI + Groq (llama-3.1-70b-versatile) + ChromaDB RAG + MongoDB

---

## Quick Start

```bash
# 1. Enter the backend directory
cd backend

# 2. (Optional) Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy env and add your key (already done if you have .env)
cp .env.example .env
# Set GROQ_API_KEY in .env

# 5. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

> **Note:** MongoDB is optional. The server falls back to in-memory session storage automatically if MongoDB is unreachable.

---

## Endpoints

### `POST /api/session/start`

Create a new interview session. Groq generates the first question. For `company` mode, ChromaDB RAG retrieves company-specific context first.

```bash
# Technical interview
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "technical", "difficulty": "mid"}'

# HR / Behavioral interview
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "hr", "difficulty": "senior"}'

# Company-specific interview (RAG-enhanced)
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "company", "company": "Google", "difficulty": "mid"}'
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_question": "I'm Dossier, your interviewer. Let's start: Can you walk me through the time complexity of a binary search and explain why it's O(log n)?"
}
```

---

### `POST /api/respond`

Send the candidate's answer. Groq generates a follow-up question or probes deeper if the answer is weak. Full conversation history is sent on every call.

```bash
# Replace SESSION_ID with the id from /api/session/start
curl -X POST http://localhost:8000/api/respond \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "user_answer": "Binary search works by repeatedly halving the search space. It is O(log n) because each step eliminates half the remaining elements."
  }'
```

**Response:**
```json
{
  "session_id": "SESSION_ID",
  "ai_response": "That is correct on the complexity. Now tell me: what are the preconditions for binary search to work, and what happens if you apply it to an unsorted array?"
}
```

---

### `POST /api/session/end`

End the session. Groq analyses the full transcript and returns a structured debrief with scores and actionable feedback.

```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{"session_id": "SESSION_ID"}'
```

**Response:**
```json
{
  "session_id": "SESSION_ID",
  "overall_score": 72,
  "strong_areas": [
    "Correctly identified O(log n) complexity",
    "Provided real-world example of binary search application"
  ],
  "weak_areas": [
    "Did not mention that the array must be sorted",
    "Missed discussion of edge cases (empty array, single element)"
  ],
  "improvement_tips": [
    "Always state preconditions before explaining an algorithm.",
    "Discuss space complexity (O(1) iterative vs O(log n) recursive) for completeness.",
    "Practice discussing trade-offs: when is linear search preferred over binary search?"
  ]
}
```

---

### `GET /health`

Liveness probe.

```bash
curl http://localhost:8000/health
# {"status":"ok","version":"0.1.0"}
```

---

## Full Session Flow (curl script)

```bash
#!/bin/bash
BASE=http://localhost:8000

# 1. Start session
echo "=== Starting session ==="
RESPONSE=$(curl -s -X POST $BASE/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "technical", "difficulty": "mid"}')

echo $RESPONSE | python -m json.tool
SESSION_ID=$(echo $RESPONSE | python -c "import sys,json; print(json.load(sys.stdin)['session_id'])")
echo "Session ID: $SESSION_ID"

# 2. Answer the first question
echo -e "\n=== Sending answer ==="
curl -s -X POST $BASE/api/respond \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"user_answer\": \"A hash map provides O(1) average lookup by using a hash function to map keys to bucket indices. Collisions are handled via chaining or open addressing.\"}" | python -m json.tool

# 3. End session and get debrief
echo -e "\n=== Ending session ==="
curl -s -X POST $BASE/api/session/end \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\"}" | python -m json.tool
```

---

## Architecture

```
backend/
├── main.py                  # FastAPI app, CORS, lifespan hooks
├── config.py                # Settings via pydantic-settings (.env)
├── .env                     # GROQ_API_KEY, MONGODB_URI
├── requirements.txt
│
├── routers/
│   └── session_engine.py    # POST /api/session/start|end, /api/respond
│
├── services/
│   ├── groq_service.py      # Groq SDK wrapper — system prompts, completions
│   └── rag_service.py       # ChromaDB init + query (sentence-transformers)
│
├── db/
│   └── client.py            # Motor async MongoDB client (fault-tolerant)
│
├── models/
│   └── session.py           # Pydantic request/response models
│
└── kb/                      # Company knowledge base (JSON files for RAG)
    ├── google.json
    ├── amazon.json
    ├── microsoft.json
    ├── salesforce.json
    └── ubs.json
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Get free key at [console.groq.com](https://console.groq.com) |
| `MONGODB_URI` | Optional | Falls back to in-memory if not set or unreachable |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins (default: localhost:5173,3000) |
| `APP_ENV` | Optional | `development` or `production` |
