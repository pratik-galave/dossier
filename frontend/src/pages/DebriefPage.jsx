import { useState } from 'react'
import { Link } from 'react-router-dom'

// ── Default placeholder data (shown when no real session exists) ──────────────
const defaultStrong = [
  'Clear verbal articulation and confident voice delivery',
  'Good core understanding of basic data structures',
  'Proactive explanation of real-world use cases',
]
const defaultWeak = [
  'Big-O time & space complexity analysis under pressure',
  'Missing discussion of edge cases',
  'Lacks specific quantitative metrics in answers',
]
const defaultTips = [
  'State the Big-O time and space complexity explicitly before diving into details.',
  'Structure technical answers using the Problem → Trade-offs → Solution pattern.',
  'Practice discussing concurrent data structures for mid/senior level roles.',
]

// ── Load real debrief from sessionStorage, or fall back to placeholder ────────
function loadDebrief() {
  try {
    const raw = sessionStorage.getItem('dossier_debrief')
    if (raw) {
      const d = JSON.parse(raw)
      return {
        overall_score: d.overall_score ?? 79,
        strong_areas: d.strong_areas?.length ? d.strong_areas : defaultStrong,
        weak_areas: d.weak_areas?.length ? d.weak_areas : defaultWeak,
        improvement_tips: d.improvement_tips?.length ? d.improvement_tips : defaultTips,
      }
    }
  } catch {}
  return {
    overall_score: 79,
    strong_areas: defaultStrong,
    weak_areas: defaultWeak,
    improvement_tips: defaultTips,
  }
}

// ── ScoreBar Component ────────────────────────────────────────────────────────
function ScoreBar({ item }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 font-medium">{item.label}</span>
        <span className="font-semibold text-gray-900">{item.score}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          id={item.id}
          className={`h-full ${item.color} rounded-full transition-all duration-500`}
          style={{ width: `${item.score}%` }}
          role="progressbar"
          aria-valuenow={item.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={item.label}
        />
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DebriefPage() {
  const debrief = loadDebrief()
  const { overall_score, strong_areas, weak_areas, improvement_tips } = debrief

  const [copied, setCopied] = useState(false)

  // ── Derived score bars from overall score ─────────────────────────────────
  const scoreCategories = [
    { id: 'score-communication', label: 'Communication', score: Math.min(overall_score + 8, 100), color: 'bg-gray-900' },
    { id: 'score-depth', label: 'Technical Depth', score: Math.max(overall_score - 10, 10), color: 'bg-gray-700' },
    { id: 'score-structure', label: 'Answer Structure', score: Math.min(overall_score + 2, 100), color: 'bg-gray-500' },
    { id: 'score-confidence', label: 'Confidence', score: Math.min(overall_score + 12, 100), color: 'bg-gray-400' },
  ]

  // ── Share / Social copy ──────────────────────────────────────────────────
  const handleShareDossier = () => {
    const summary = [
      `📊 My Dossier AI Mock Interview Score: ${overall_score}/100`,
      `✅ Strength: ${strong_areas[0] || 'Strong core fundamentals'}`,
      `⚠️ Focus Area: ${weak_areas[0] || 'Needs deeper technical analysis'}`,
      `💡 Tip: ${improvement_tips[0] || 'Practice structured STAR-method answers'}`,
      `\nBuild your Dossier before they do! 🚀 #DossierAI #InterviewPrep`,
    ].join('\n')

    navigator.clipboard.writeText(summary).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="container-content py-12 md:py-16">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10 pb-6 border-b border-[#E5E7EB]">
        <div>
          <span className="badge mb-3">Session complete</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Interview debrief</h1>
          <p className="text-sm text-gray-500">
            AI-generated analysis by Groq (Llama 3.1) · Dossier
          </p>
        </div>

        <button
          type="button"
          onClick={handleShareDossier}
          className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2 shrink-0 self-start"
          id="share-dossier-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copied ? '✓ Copied!' : 'Share your Dossier'}
        </button>
      </div>

      {copied && (
        <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-medium text-center">
          ✓ Summary copied to clipboard — paste it on LinkedIn, Twitter/X, or Discord!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Score summary ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Overall score */}
          <div className="card flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Overall score</p>
            <div
              id="debrief-overall-score"
              className="text-6xl font-bold text-gray-900"
              aria-label={`Score: ${overall_score} out of 100`}
            >
              {overall_score}
            </div>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>

          {/* Score breakdown */}
          <div className="card flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-900">Score breakdown</h2>
            {scoreCategories.map((item) => (
              <ScoreBar key={item.id} item={item} />
            ))}
          </div>

          {/* ── Strong Areas — Left green accent ── */}
          <div className="border-l-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-r-xl">
            <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ✅ Strong Areas
            </h2>
            <ul className="flex flex-col gap-2">
              {strong_areas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold shrink-0">✓</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Weak Areas — Left red accent ── */}
          <div className="border-l-4 border-red-500 bg-red-50/50 p-4 rounded-r-xl">
            <h2 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ⚠️ Weak Areas (Focus Here)
            </h2>
            <ul className="flex flex-col gap-2">
              {weak_areas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-950 leading-relaxed">
                  <span className="font-bold shrink-0">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link to="/setup" className="btn-primary w-full justify-center" id="debrief-retry-btn">
              Start new session
            </Link>
          </div>
        </div>

        {/* ── Right: Improvement tips ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* ── Improvement Tips — Numbered list ── */}
          <div className="card flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              💡 Actionable Improvement Tips
            </h2>
            <ol className="flex flex-col gap-4">
              {improvement_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{tip}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Call to action if no real session data */}
          {!sessionStorage.getItem('dossier_debrief') && (
            <div className="card flex flex-col items-center gap-4 py-10 text-center border-dashed text-gray-400">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm">
                This is placeholder data. Complete a real interview session to see your personalised debrief.
              </p>
              <Link to="/setup" className="btn-primary text-sm px-4 py-2">
                Start a real session →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
