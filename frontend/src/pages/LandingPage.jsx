import { Link } from 'react-router-dom'

// ── Feature card data ─────────────────────────────────────────────────────────
const features = [
  {
    id: 'feature-voice',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    ),
    title: 'Voice-first interviews',
    description:
      'Speak naturally — Dossier listens, responds with AI voice, and transcribes everything in real time.',
  },
  {
    id: 'feature-ai',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    title: 'Claude-powered questions',
    description:
      'Questions adapt to your role, company, and skill level — powered by Anthropic Claude.',
  },
  {
    id: 'feature-debrief',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Instant debrief',
    description:
      'After every session, get a structured debrief: scores, strengths, gaps, and model answers.',
  },
  {
    id: 'feature-modes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    title: 'Three interview modes',
    description:
      'Tech, HR, or company-specific prep — each with tailored question banks and evaluation rubrics.',
  },
]

// ── How-it-works steps ────────────────────────────────────────────────────────
const steps = [
  { number: '01', title: 'Choose your mode', body: 'Select Tech, HR, or Company-specific. Optionally paste the job description.' },
  { number: '02', title: 'Start speaking', body: 'Click the mic and answer questions naturally. Dossier listens and follows up in real time.' },
  { number: '03', title: 'Review your debrief', body: 'Get a structured report — scores, sample answers, and actionable next steps.' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        className="container-content pt-24 pb-20 text-center"
        aria-labelledby="hero-heading"
      >
        <span className="badge mb-6">Now in beta · Free to try</span>

        <h1
          id="hero-heading"
          className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto mb-6 text-center"
        >
          Build your Dossier before they do.
        </h1>

        {/* 3 Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <span className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            🔥 Brutal Feedback
          </span>
          <span className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            🎙️ Voice-first
          </span>
          <span className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            🎯 Company-specific
          </span>
        </div>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Dossier is an AI interview coach that runs realistic voice interviews, evaluates
          your answers, and gives you a detailed debrief — so you walk in confident.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/setup" className="btn-primary text-base px-6 py-3" id="hero-cta-primary">
            Start a mock interview
          </Link>
          <a
            href="#how-it-works"
            className="btn-secondary text-base px-6 py-3"
            id="hero-cta-secondary"
          >
            See how it works
          </a>
        </div>

        {/* Divider */}
        <div className="mt-20 border-t border-[#E5E7EB]" />
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="container-content py-20"
        aria-labelledby="hiw-heading"
      >
        <h2
          id="hiw-heading"
          className="text-2xl font-semibold text-gray-900 mb-12 text-center"
        >
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
                {step.number}
              </span>
              <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t border-[#E5E7EB]" />
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="container-content py-20"
        aria-labelledby="features-heading"
      >
        <h2
          id="features-heading"
          className="text-2xl font-semibold text-gray-900 mb-12 text-center"
        >
          Everything you need to prepare
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.id} id={f.id} className="card flex flex-col gap-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 shrink-0">
                {f.icon}
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t border-[#E5E7EB]" />
      </section>

      {/* ── CTA Banner ── */}
      <section className="container-content py-20 text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-3xl font-bold text-gray-900 mb-4">
          Ready to start?
        </h2>
        <p className="text-gray-500 mb-8">
          No signup required. Pick a mode and start talking.
        </p>
        <Link to="/setup" className="btn-primary text-base px-8 py-3" id="bottom-cta">
          Begin your session →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB] py-8">
        <div className="container-content flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2025 Dossier. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}
