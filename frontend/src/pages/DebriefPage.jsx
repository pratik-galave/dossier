import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const APP_URL = 'https://frontend-2c42.prg1.zerops.app'

// ── Load real debrief from sessionStorage ─────────────────────────────────────
function loadDebrief() {
  try {
    const raw = sessionStorage.getItem('dossier_debrief')
    if (raw) {
      const d = JSON.parse(raw)
      return {
        overall_score: d.overall_score ?? null,
        strong_areas: Array.isArray(d.strong_areas) ? d.strong_areas : [],
        weak_areas: Array.isArray(d.weak_areas) ? d.weak_areas : [],
        improvement_tips: Array.isArray(d.improvement_tips) ? d.improvement_tips : [],
      }
    }
  } catch {}
  return null
}

// ── ScoreCircle Component ─────────────────────────────────────────────────────
function ScoreCircle({ score }) {
  const color =
    score > 70 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626'

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const filled = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-label={`Score: ${score} out of 100`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={filled}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" dominantBaseline="middle"
          fontSize="28" fontWeight="700" fill={color} fontFamily="Inter, system-ui, sans-serif">
          {score}
        </text>
        <text x="70" y="88" textAnchor="middle" dominantBaseline="middle"
          fontSize="12" fill="#9CA3AF" fontFamily="Inter, system-ui, sans-serif">
          / 100
        </text>
      </svg>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Overall Score
      </p>
    </div>
  )
}

// ── ShareModal Component ──────────────────────────────────────────────────────
function ShareModal({ shareText, score, onClose }) {
  const [copied, setCopied] = useState(false)

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tweetText = encodeURIComponent(
    `I scored ${score}/100 on Dossier AI Interview Coach! Try it: ${APP_URL}`
  )
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Share your Dossier"
    >
      {/* Modal panel — stop propagation so clicks inside don't close */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          id="share-modal-close"
          onClick={onClose}
          aria-label="Close share modal"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="pr-6">
          <h2 className="text-base font-semibold text-gray-900">Share your result</h2>
          <p className="text-xs text-gray-400 mt-0.5">Let the world know how you did 🎯</p>
        </div>

        {/* Share text preview */}
        <div className="bg-gray-50 border border-[#E5E7EB] rounded-lg px-4 py-3 text-xs text-gray-600 leading-relaxed whitespace-pre-line">
          {shareText}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">

          {/* Copy to Clipboard */}
          <button
            type="button"
            id="share-copy-btn"
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 hover:border-gray-300 text-sm font-medium text-gray-700 transition-all text-left"
          >
            {copied ? (
              <>
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-gray-900">Copied!</span>
              </>
            ) : (
              <>
                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </span>
                Copy to Clipboard
              </>
            )}
          </button>

          {/* LinkedIn */}
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="share-linkedin-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-blue-50 hover:border-blue-200 text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0077B5]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" fill="white" />
                <circle cx="4" cy="4" r="2" fill="white" />
              </svg>
            </span>
            Share on LinkedIn
          </a>

          {/* Twitter / X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="share-twitter-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 hover:border-gray-300 text-sm font-medium text-gray-700 transition-all"
          >
            <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 300 300" fill="white">
                <path d="M178.57 127.15L290.27 0h-26.46l-96.79 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.37-116.72 81.8 116.72H300L178.57 127.15zm-36.26 41.36-11.87-16.61L36.15 19.54h40.71l76.2 106.72 11.87 16.61 99.05 138.65h-40.71l-80.96-113.41z" />
              </svg>
            </span>
            Share on Twitter / X
          </a>

        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DebriefPage() {
  const navigate = useNavigate()
  const debrief = loadDebrief()
  const [showModal, setShowModal] = useState(false)

  // No session data — show friendly prompt
  if (!debrief) {
    return (
      <div className="container-content py-32 flex flex-col items-center text-center gap-6">
        <span className="badge">No session found</span>
        <h1 className="text-3xl font-bold text-gray-900">No debrief data</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          Complete a mock interview session first to see your personalised debrief.
        </p>
        <button
          onClick={() => navigate('/setup')}
          className="btn-primary"
          id="debrief-start-btn"
        >
          Start a session →
        </button>
      </div>
    )
  }

  const { overall_score, strong_areas, weak_areas, improvement_tips } = debrief

  // ── Share text ─────────────────────────────────────────────────────────────
  const firstWeak = weak_areas[0] || 'areas for growth'
  const shareText =
    `🎯 Just completed an AI mock interview on Dossier!\n` +
    `Score: ${overall_score}/100\n` +
    `Biggest area to improve: ${firstWeak}\n` +
    `Try it yourself 👇\n` +
    `${APP_URL}`

  return (
    <div className="container-content py-12 md:py-16">

      {/* ── Share Modal ────────────────────────────────────────────────────── */}
      {showModal && (
        <ShareModal
          shareText={shareText}
          score={overall_score}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10 pb-6 border-b border-[#E5E7EB]">
        <div>
          <span className="badge mb-3">Session complete</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Interview Debrief</h1>
          <p className="text-sm text-gray-500">
            AI-generated analysis · Dossier
          </p>
        </div>
      </div>

      {/* ── Score card ────────────────────────────────────────────────────── */}
      <div className="card flex flex-col items-center py-10 mb-8" id="debrief-score-card">
        {overall_score !== null ? (
          <ScoreCircle score={overall_score} />
        ) : (
          <p className="text-gray-400 text-sm">Score not available</p>
        )}
      </div>

      {/* ── Two-column: Strong / Weak ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Strong Areas */}
        <div
          id="debrief-strong-areas"
          style={{ borderLeft: '4px solid #16a34a' }}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span style={{ color: '#16a34a' }}>✓</span> Strong Areas
          </h2>
          {strong_areas.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {strong_areas.map((area, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0 font-bold"
                    style={{ backgroundColor: '#16a34a' }}
                  >✓</span>
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No strong areas recorded.</p>
          )}
        </div>

        {/* Weak Areas */}
        <div
          id="debrief-weak-areas"
          style={{ borderLeft: '4px solid #dc2626' }}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span style={{ color: '#dc2626' }}>⚠</span> Weak Areas
          </h2>
          {weak_areas.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {weak_areas.map((area, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 font-bold"
                    style={{ backgroundColor: '#dc2626' }}
                  >!</span>
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No weak areas recorded.</p>
          )}
        </div>
      </div>

      {/* ── Improvement Tips ──────────────────────────────────────────────── */}
      <div className="card mb-8" id="debrief-improvement-tips">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          💡 Improvement Tips
        </h2>
        {improvement_tips.length > 0 ? (
          <ol className="flex flex-col gap-4">
            {improvement_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-4 text-sm text-gray-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-400">No tips available.</p>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

        {/* Share button — opens modal */}
        <button
          type="button"
          id="share-dossier-btn"
          onClick={() => setShowModal(true)}
          className="btn-primary flex-1 sm:flex-none justify-center"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share your Dossier
        </button>

        {/* Spacer */}
        <div className="flex-1 hidden sm:block" />

        {/* Practice Again */}
        <button
          type="button"
          id="debrief-practice-again-btn"
          onClick={() => navigate('/setup')}
          className="btn-secondary flex-1 sm:flex-none justify-center"
        >
          Practice Again
        </button>
      </div>

    </div>
  )
}
