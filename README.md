# Dossier — AI-Powered Voice Interview Coach

**Dossier** is an AI-powered interview coach designed to bridge the gap between static interview preparation and high-stakes real-world pressure. Built on the premise that true confidence comes from active verbal practice, Dossier acts as a demanding yet constructive interviewer named *Dossier*. It conducts voice-first mock interviews using native browser Web Speech STT/TTS, probes candidate responses for depth using Groq's high-speed Llama-3.1-70B model, retrieves company-specific interview patterns via a ChromaDB RAG pipeline, and generates comprehensive debrief reports with actionable feedback.

---

## 🛠️ Tech Stack

### Frontend
- **Framework & Build**: React 18 + Vite
- **Styling & Design System**: TailwindCSS (Minimalist Notion-like white aesthetic, Inter font, custom subtle borders, no gradients)
- **Routing**: React Router v6
- **Voice Engine**: Browser Native Web Speech API (`SpeechRecognition` for STT with real-time transcript & `SpeechSynthesis` for TTS with voice selection and interrupt support)

### Backend
- **Framework**: FastAPI (Python 3.12)
- **AI / LLM Engine**: Groq API (`llama-3.1-70b-versatile`) for ultra-low latency interview responses & debrief evaluation
- **RAG & Vector Database**: ChromaDB + `sentence-transformers` (`all-MiniLM-L6-v2`) embedding pipeline
- **Database Client**: Motor (Async MongoDB client with automatic in-memory fallback for dev)
- **Data Validation & Settings**: Pydantic v2 & `pydantic-settings`

### Database & Infrastructure
- **Database**: MongoDB (Sessions, message histories, debrief analytics)
- **Deployment Platform**: Zerops (Multi-service deployment configuration for Static Frontend, FastAPI Backend, and Managed MongoDB)

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.11+
- **Groq API Key**: Get a free API key from [console.groq.com](https://console.groq.com)
- **MongoDB** *(Optional)*: Local MongoDB instance or Atlas connection string (App falls back to in-memory mode if DB is offline)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in `/backend` (or copy `.env.example`):
   ```ini
   MONGODB_URI=mongodb://localhost:27017/dossier
   GROQ_API_KEY=gsk_your_actual_groq_api_key
   ELEVENLABS_API_KEY=placeholder_if_using_elevenlabs
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   > *The server will automatically embed the company knowledge base into ChromaDB on startup.*

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   `http://localhost:5173`

---

## ☁️ Deploying on Zerops

Dossier includes a production-ready `zerops.yaml` configuration file for zero-config deployment on [Zerops](https://zerops.io).

### Zerops Architecture (`zerops.yaml`)

The application is structured into three connected Zerops services:

1. **`frontend` (Static Service)**
   - **Build**: Uses Node.js 20 base to run `npm install && npm run build`.
   - **Runtime**: Serves `frontend/dist/` as a high-performance static site with single-page application (SPA) routing fallback.

2. **`backend` (Python Service)**
   - **Build**: Uses Python 3.12 base to run `pip install -r requirements.txt`.
   - **Runtime**: Runs `uvicorn main:app --host 0.0.0.0 --port 8000` listening on port 8000.
   - **Environment Variables**: Reads `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`, and automatically receives `${mongodb_connectionString}` injected by Zerops.

3. **`mongodb` (Managed Database)**
   - Managed MongoDB instance provisioned directly via Zerops.
   - Automatically provides connection credentials to the backend service.

---

## 📸 Screenshots

### Landing Page
![Landing Page Screenshot Placeholder](https://via.placeholder.com/1200x630.png?text=Dossier+Landing+Page+Mockup)

### Interview Mode Setup
![Setup Page Screenshot Placeholder](https://via.placeholder.com/1200x630.png?text=Dossier+Setup+Page+Mockup)

### Voice-Enabled Interview Room
![Interview Room Screenshot Placeholder](https://via.placeholder.com/1200x630.png?text=Dossier+Voice+Interview+Room+Mockup)

### Detailed Debrief & Scorecard
![Debrief Page Screenshot Placeholder](https://via.placeholder.com/1200x630.png?text=Dossier+Debrief+Page+Mockup)

---

## 📜 License

MIT License © 2025 Dossier.
