# 🎙️ Dossier — AI Interview Coach

Dossier is an interactive, voice-based AI interview coach designed to help candidates prepare for technical, HR, and company-specific interviews. It features a low-latency, two-way voice conversation loop and provides detailed, actionable feedback to help you land your dream role.

Built for the **WeMakeDevs x Zerops Buildathon**.

### 🚀 Live Links
- **Frontend:** [https://frontend-2c42.prg1.zerops.app](https://frontend-2c42.prg1.zerops.app)
- **Backend API:** [https://backend-2c42-8000.prg1.zerops.app](https://backend-2c42-8000.prg1.zerops.app)

---

## ✨ Features

* **Two-Way Voice Loop:** Real-time conversational AI using Groq Whisper API for lightning-fast speech-to-text and Web Speech API for voice synthesis.
* **Custom RAG Architecture:** Company-specific interview modes powered by a local Knowledge Base (KB) lookup, tailoring questions to specific corporate expectations.
* **Dynamic Scenarios:** Choose between Tech, HR, or Company-specific modes with an Easy/Medium/Hard difficulty selector.
* **Comprehensive Debrief:** After a max 10-question session, receive a detailed breakdown of your performance, including AI-calculated scores, weak/strong areas, and actionable improvement tips.
* **Shareable Results:** Built-in share modal to flex your interview scores on LinkedIn, Twitter, or via clipboard.
* **Session Persistence:** File-based JSON storage ensures your interview state and results are safely retained across the session.

---

## 🛠️ Tech Stack

**Frontend:**
* React + Vite
* TailwindCSS for rapid, responsive styling
* Web Speech API (TTS)

**Backend:**
* FastAPI (Python)
* MongoDB Session Storage
* Dict-based local KB lookup for RAG

**AI & Cloud:**
* **LLM:** Groq API (`llama-3.1-70b-versatile`) for high-speed, intelligent logic
* **STT:** Groq Whisper API
* **Deployment:** [Zerops](https://zerops.io/) (Both Frontend and Backend)

---

## ⚙️ Local Setup

Want to run Dossier locally? Follow these steps:

### Prerequisites
* Python 3.9+
* Node.js & npm
* A Groq API Key

### Backend Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/pratik-galave/dossier.git](https://github.com/pratik-galave/dossier.git)
   cd dossier/backend
Create and activate a virtual environment:

Bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
Install dependencies:

Bash
pip install -r requirements.txt
Set up your environment variables:
Create a .env file in the backend directory and add your Groq API key:

Code snippet
GROQ_API_KEY=your_api_key_here
Run the FastAPI server:

Bash
uvicorn main:app --reload
Frontend Setup
Navigate to the frontend directory:

Bash
cd ../frontend
Install dependencies:

Bash
npm install
Run the Vite development server:

Bash
npm run dev
Note: For the best voice experience, please use earphones with a built-in microphone to prevent audio looping/echo.

🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

📝 License
This project is open-source and available under the MIT License.