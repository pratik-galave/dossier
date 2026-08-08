import { Link, NavLink, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
]

export default function Navbar() {
  const location = useLocation()
  const isInterviewRoom = location.pathname === '/interview'

  // In the interview room, show minimal nav
  if (isInterviewRoom) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="container-content h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Dossier</span>
          </Link>
          <span className="badge">Interview in progress</span>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
      <div className="container-content h-14 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Dossier home"
        >
          {/* Wordmark logo mark */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-gray-900"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 8h6M7 12h10M7 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-base font-semibold tracking-tight text-gray-900">
            Dossier
          </span>
        </Link>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/debrief"
            className="hidden sm:inline-block text-sm text-gray-500 hover:text-gray-900 transition-colors duration-100"
          >
            Past sessions
          </NavLink>
          <Link to="/setup" className="btn-primary" id="nav-start-cta">
            Start interview
          </Link>
        </div>
      </div>
    </header>
  )
}
