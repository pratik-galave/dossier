import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../api'

// ── Interview mode definitions ────────────────────────────────────────────────
const modes = [
  {
    id: 'mode-tech',
    key: 'technical',
    label: 'Technical',
    tagline: 'DSA, system design, and coding',
    description:
      'Covers data structures, algorithms, system design, and role-specific coding questions. Best for SWE, Data, and DevOps roles.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    tags: ['Coding', 'System Design', 'DSA'],
  },
  {
    id: 'mode-hr',
    key: 'hr',
    label: 'HR / Behavioral',
    tagline: 'STAR-method behavioral questions',
    description:
      'Focuses on situational and behavioral questions. Covers leadership, conflict resolution, motivation, and culture fit.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tags: ['STAR Method', 'Leadership', 'Culture fit'],
  },
  {
    id: 'mode-company',
    key: 'company',
    label: 'Company-Specific',
    tagline: 'Tailored to a target company & role',
    description:
      'Choose a target company. Dossier uses a RAG knowledge base with real interview patterns to generate hyper-targeted questions.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    tags: ['Job Description', 'Role-specific', 'Custom'],
  },
]

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Salesforce', 'UBS']

// ── Difficulty definitions ────────────────────────────────────────────────────
const difficulties = [
  {
    id: 'diff-easy',
    key: 'easy',
    label: 'Easy',
    tagline: 'Beginner friendly, conceptual questions',
    accent: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    id: 'diff-medium',
    key: 'medium',
    label: 'Medium',
    tagline: 'Industry standard interview difficulty',
    accent: '#ca8a04',
    bg: '#fefce8',
  },
  {
    id: 'diff-hard',
    key: 'hard',
    label: 'Hard',
    tagline: 'FAANG level, expect follow-ups on everything',
    accent: '#dc2626',
    bg: '#fef2f2',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState('technical')
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [company, setCompany] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    setError('')
    if (selectedMode === 'company' && !company.trim()) {
      setError('Please select or enter a company name for company-specific mode.')
      return
    }

    setIsStarting(true)

    try {
      const data = await startSession(
        selectedMode,
        selectedMode === 'company' ? company.trim() : null,
        selectedDifficulty
      )

      // Persist session info for the Interview Room to pick up
      sessionStorage.setItem(
        'dossier_session',
        JSON.stringify({
          session_id: data.session_id,
          first_question: data.first_question,
          mode: selectedMode,
          company: company || null,
        })
      )

      navigate('/interview')
    } catch (err) {
      setError(err.message || 'Failed to start session. Is the backend running?')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="container-content py-16" aria-labelledby="setup-heading">
      {/* Page header */}
      <div className="mb-12">
        <span className="badge mb-4">Step 1 of 2</span>
        <h1 id="setup-heading" className="text-3xl font-bold text-gray-900 mb-2">
          Choose your interview type
        </h1>
        <p className="text-gray-500">
          Select a mode to get started. Dossier will generate a real interview using Groq AI.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12" role="list">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.key
          return (
            <button
              key={mode.id}
              id={mode.id}
              type="button"
              role="listitem"
              onClick={() => setSelectedMode(mode.key)}
              className={`card group flex flex-col gap-5 cursor-pointer text-left transition-all duration-150 ${
                isSelected
                  ? 'border-gray-900 shadow-sm ring-2 ring-gray-900 ring-offset-2'
                  : 'hover:border-gray-400 hover:shadow-sm'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${mode.label} interview`}
            >
              {/* Icon */}
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors duration-150 ${
                isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white'
              }`}>
                {mode.icon}
              </span>

              {/* Text */}
              <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-900 mb-1">{mode.label}</h2>
                <p className="text-xs text-gray-400 mb-3 font-medium">{mode.tagline}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{mode.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {mode.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-[#E5E7EB] mb-10" />

      {/* Difficulty selector */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Difficulty</h2>
        <p className="text-xs text-gray-400 mb-4">Choose the challenge level for your session.</p>
        <div className="flex flex-col sm:flex-row gap-3" role="list">
          {difficulties.map((d) => {
            const isSelected = selectedDifficulty === d.key
            return (
              <button
                key={d.id}
                id={d.id}
                type="button"
                role="listitem"
                onClick={() => setSelectedDifficulty(d.key)}
                aria-pressed={isSelected}
                aria-label={`Select ${d.label} difficulty`}
                className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer"
                style={{
                  borderColor: isSelected ? d.accent : '#E5E7EB',
                  backgroundColor: isSelected ? d.bg : '#ffffff',
                  boxShadow: isSelected ? `0 0 0 2px ${d.accent}` : 'none',
                }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: d.accent }}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                  <p className="text-xs text-gray-500">{d.tagline}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] mb-10" />

      {/* Company selector (only for company mode) */}
      {selectedMode === 'company' && (
        <div className="max-w-lg mb-8">
          <label htmlFor="setup-company" className="text-sm font-medium text-gray-700 block mb-2">
            Target company
          </label>
          <div className="flex gap-3 flex-wrap mb-3">
            {COMPANIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompany(c)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                  company === c
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            id="setup-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Or type a company name…"
            className="h-10 w-full px-3 text-sm border border-[#E5E7EB] rounded-md bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
          ⚠️ {error}
        </p>
      )}

      {/* Action */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          className="btn-primary px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          id="setup-continue-btn"
        >
          {isStarting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting session…
            </>
          ) : (
            'Start interview →'
          )}
        </button>
        <a href="/" className="btn-secondary" id="setup-back-btn">
          Back
        </a>
      </div>
    </div>
  )
}
