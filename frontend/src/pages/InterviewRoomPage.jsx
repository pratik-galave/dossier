import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession, sendAnswer, endSession, transcribeAudio } from '../api'

// ── MicButton Component ───────────────────────────────────────────────────────
function MicButton({ state, onClick, disabled }) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'

  return (
    <button
      id="interview-mic-btn"
      type="button"
      onClick={onClick}
      disabled={disabled || isProcessing}
      aria-label={
        isRecording
          ? 'Stop recording'
          : isSpeaking
          ? 'Mic disabled while speaking'
          : 'Start recording'
      }
      className={`relative flex items-center justify-center w-16 h-16 rounded-full text-white transition-all duration-200
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-4
                 active:scale-95 cursor-pointer select-none ${
                   isRecording
                     ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-100 shadow-md'
                     : isSpeaking
                     ? 'bg-gray-400 cursor-not-allowed opacity-80'
                     : isProcessing
                     ? 'bg-gray-800 cursor-wait'
                     : 'bg-gray-900 hover:bg-black'
                 }`}
    >
      {isRecording && (
        <span
          className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {isProcessing ? (
        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : isRecording ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      )}
    </button>
  )
}

// ── ChatBubble Component ──────────────────────────────────────────────────────
function ChatBubble({ message, isInterim = false }) {
  const isAi = message.role === 'ai'
  return (
    <div
      id={message.id}
      className={`flex flex-col gap-1 max-w-[80%] ${isAi ? 'self-start' : 'self-end items-end'}`}
    >
      <span className="text-[10px] font-medium text-gray-400 px-1">
        {isAi ? 'Dossier' : 'You'} · {message.time || 'Now'}
      </span>
      <div
        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAi
            ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
            : isInterim
            ? 'bg-gray-800 text-gray-200 border border-red-500/40 rounded-tr-sm animate-pulse'
            : 'bg-gray-900 text-white rounded-tr-sm'
        }`}
      >
        {message.text}
        {isInterim && <span className="inline-block w-1.5 h-3 ml-1 bg-red-400 animate-ping" />}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InterviewRoomPage() {
  const navigate = useNavigate()

  // ── Session state (loaded from sessionStorage) ───────────────────────────
  const [sessionId, setSessionId] = useState(null)
  const [sessionMode, setSessionMode] = useState('technical')
  const [sessionCompany, setSessionCompany] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  // ── UI state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [uiState, setUiState] = useState('idle') // 'idle' | 'recording' | 'processing' | 'speaking'
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isEnding, setIsEnding] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const mediaStreamRef = useRef(null)
  const mimeTypeRef = useRef('')
  const transcriptEndRef = useRef(null)

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── Load session from sessionStorage (set by SetupPage) ───────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dossier_session')
      if (raw) {
        const session = JSON.parse(raw)
        setSessionId(session.session_id)
        setSessionMode(session.mode || 'technical')
        setSessionCompany(session.company || null)

        // First AI message from session start
        if (session.first_question) {
          const firstMsg = {
            id: 'msg-0',
            role: 'ai',
            text: session.first_question,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages([firstMsg])
          // Speak the first question
          setTimeout(() => speakAiResponse(session.first_question), 600)
        }
      } else {
        // No session — start a default one
        startFallbackSession()
      }
    } catch {
      startFallbackSession()
    } finally {
      setSessionLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startFallbackSession = async () => {
    try {
      const data = await startSession('technical')
      setSessionId(data.session_id)
      const firstMsg = {
        id: 'msg-0',
        role: 'ai',
        text: data.first_question,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([firstMsg])
      setTimeout(() => speakAiResponse(data.first_question), 600)
    } catch (err) {
      setSessionError(err.message || 'Could not start session. Is backend running?')
    }
  }

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, uiState])

  // ── Setup SpeechSynthesis & Audio Stream Cleanup ─────────────────────────
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {}
      window.speechSynthesis.getVoices()
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── Voice helpers (TTS) ──────────────────────────────────────────────────
  const getBestVoice = () => {
    if (!('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null
    const enVoices = voices.filter((v) => v.lang.startsWith('en'))
    const maleKeywords = ['male', 'david', 'james', 'alex', 'mark', 'george', 'daniel', 'google us english', 'guy']
    return (
      enVoices.find((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
      voices.find((v) => v.lang === 'en-US') ||
      enVoices[0] ||
      voices[0]
    )
  }

  const speakAiResponse = (text) => {
    if (!('speechSynthesis' in window)) { setUiState('idle'); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onstart = () => setUiState('speaking')
    utterance.onend = () => setUiState('idle')
    utterance.onerror = () => setUiState('idle')
    window.speechSynthesis.speak(utterance)
  }

  const handleStopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setUiState('idle')
  }

  // ── MediaRecorder API Recording (STT) ────────────────────────────────────
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return ''
  }

  const startRecording = async () => {
    if (uiState === 'speaking') handleStopSpeaking()
    audioChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType
      console.log('Using mime type:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setUiState('recording')
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Microphone access denied or unavailable.')
      setUiState('idle')
    }
  }

  const stopRecordingAndSend = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return

    setUiState('processing')

    mediaRecorder.onstop = async () => {
      // Turn off microphone track hardware light
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      const mimeType = mimeTypeRef.current || ''
      const extension = mimeType.includes('ogg') ? 'ogg' :
                        mimeType.includes('mp4') ? 'mp4' : 'webm'
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
      audioChunksRef.current = []

      if (audioBlob.size === 0) {
        setUiState('idle')
        return
      }

      try {
        const data = await transcribeAudio(audioBlob, `audio.${extension}`)
        const text = (data.transcript || '').trim()
        if (text) {
          setUserMessage(text)
          await processUserAnswer(text)
        } else {
          setUiState('idle')
        }
      } catch (err) {
        console.error('Transcription error:', err)
        setUiState('idle')
      }
    }

    mediaRecorder.stop()
  }

  const handleMicClick = () => {
    if (uiState === 'recording') {
      stopRecordingAndSend()
    } else if (uiState === 'idle' || uiState === 'speaking') {
      startRecording()
    }
  }

  // ── Core: Send answer via sendAnswer() api helper ───────────────────────
  const processUserAnswer = async (userText) => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setUiState('processing')

    let aiResponseText = "I'm processing your answer. One moment…"

    try {
      const data = await sendAnswer(sessionId, userText)
      aiResponseText = data.ai_response || data.response || data.ai_text || aiResponseText
    } catch (err) {
      console.warn('sendAnswer failed:', err)
    }

    const aiMsg = {
      id: `msg-${Date.now() + 1}`,
      role: 'ai',
      text: aiResponseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, aiMsg])
    speakAiResponse(aiResponseText)
  }

  // ── Text input ───────────────────────────────────────────────────────────
  const handleTextSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || uiState === 'processing') return
    if (uiState === 'speaking') handleStopSpeaking()
    if (uiState === 'recording') stopRecordingAndSend()
    const text = inputText.trim()
    setUserMessage(text)
    setInputText('')
    await processUserAnswer(text)
  }

  // ── End session via endSession() api helper ─────────────────────────────
  const handleEndSession = async () => {
    if (isEnding || !sessionId) { navigate('/debrief'); return }
    setIsEnding(true)
    if (uiState === 'recording') {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
    window.speechSynthesis?.cancel()

    try {
      const debrief = await endSession(sessionId)
      sessionStorage.setItem('dossier_debrief', JSON.stringify(debrief))
    } catch (err) {
      console.warn('endSession failed:', err)
    }

    sessionStorage.removeItem('dossier_session')
    navigate('/debrief')
  }

  // ── Mode display label ───────────────────────────────────────────────────
  const modeLabel = sessionMode === 'technical'
    ? 'Technical'
    : sessionMode === 'hr'
    ? 'HR / Behavioral'
    : sessionCompany
    ? `Company · ${sessionCompany}`
    : 'Company-Specific'

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Starting your interview session…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row" aria-label="Interview room">

      {/* Backend error banner */}
      {sessionError && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-900 font-medium text-center">
          ⚠️ {sessionError}
        </div>
      )}

      {/* ── Left panel: Session info ── */}
      <aside
        className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[#E5E7EB] flex flex-col shrink-0 overflow-y-auto bg-white"
        aria-label="Interview context"
      >
        {/* Session info */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <span className="badge">{modeLabel}</span>
            <span
              id="interview-timer"
              className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md"
              aria-label="Elapsed time"
            >
              ⏱️ {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <h1 className="text-sm font-semibold text-gray-900">Dossier Mock Interview</h1>
          {sessionId && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">
              ID: {sessionId.slice(0, 16)}…
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Turns</span>
            <span className="text-xs text-gray-400">{Math.floor(messages.length / 2)}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              id="interview-progress-bar"
              className="h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(messages.length * 8, 100)}%` }}
              role="progressbar"
            />
          </div>
        </div>

        {/* Current question spotlight */}
        <div className="px-6 py-5 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Latest question
          </p>
          <p
            id="interview-current-question"
            className="text-sm font-medium text-gray-900 leading-relaxed"
          >
            {messages.filter((m) => m.role === 'ai').slice(-1)[0]?.text ||
              'Waiting for Dossier to speak…'}
          </p>
        </div>

        {/* End session */}
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleEndSession}
            disabled={isEnding}
            className="btn-secondary w-full justify-center disabled:opacity-60"
            id="interview-end-btn"
          >
            {isEnding ? 'Ending session…' : 'End session & get debrief'}
          </button>
        </div>
      </aside>

      {/* ── Right panel: Voice + Chat ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Chat transcript */}
        <div
          id="interview-transcript"
          className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4"
          aria-live="polite"
          aria-label="Interview transcript"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              <p className="text-sm">Click the mic to start answering</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Live recording indicator */}
          {uiState === 'recording' && (
            <div className="flex flex-col gap-1 max-w-[80%] self-end items-end" id="live-speech-bubble">
              <span className="text-[10px] font-medium text-red-500 px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> You · Recording…
              </span>
              <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-gray-50 border border-gray-200 shadow-sm text-gray-600 italic">
                Recording your response… click mic to stop & send
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {uiState === 'processing' && (
            <div
              id="interview-typing-indicator"
              className="self-start flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm text-gray-500 text-xs"
            >
              <span>Dossier is transcribing & thinking</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Voice toolbar */}
        <div className="border-t border-[#E5E7EB] px-6 py-5 flex flex-col items-center gap-4 bg-white">

          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {uiState === 'recording' ? (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Recording… click mic when finished</span>
              </div>
            ) : uiState === 'processing' ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Transcribing & processing…</span>
              </div>
            ) : uiState === 'speaking' ? (
              <div className="flex items-center gap-3 bg-gray-50 border border-[#E5E7EB] px-3.5 py-1.5 rounded-full">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-gray-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-gray-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-2 bg-gray-900 rounded-full animate-bounce" />
                </div>
                <span className="text-xs font-medium text-gray-800">Dossier is speaking…</span>
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="px-2 py-0.5 text-[11px] font-semibold text-gray-600 hover:text-black border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  Stop
                </button>
              </div>
            ) : (
              <p id="interview-voice-status" className="text-sm text-gray-400" aria-live="polite">
                Press the mic to start recording
              </p>
            )}
          </div>

          {/* Mic button */}
          <MicButton state={uiState} onClick={handleMicClick} />

          {/* Text input fallback */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2 w-full max-w-md">
            <input
              id="interview-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={uiState === 'recording' ? 'Recording via mic…' : 'Or type your answer…'}
              className="flex-1 h-10 px-4 text-sm border border-[#E5E7EB] rounded-md bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={uiState === 'recording' || uiState === 'processing'}
              aria-label="Type your answer"
            />
            <button
              id="interview-send-btn"
              type="submit"
              className="btn-primary h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputText.trim() || uiState === 'recording' || uiState === 'processing'}
            >
              Send
            </button>
          </form>

          <p className="text-xs text-gray-400">
            Voice STT via Groq Whisper API · TTS via Web Speech API · AI by Groq (Llama 3.3)
          </p>
        </div>
      </div>
    </div>
  )
}
