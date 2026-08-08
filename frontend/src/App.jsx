import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SetupPage from './pages/SetupPage'
import InterviewRoomPage from './pages/InterviewRoomPage'
import DebriefPage from './pages/DebriefPage'

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/interview" element={<InterviewRoomPage />} />
          <Route path="/debrief" element={<DebriefPage />} />
          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="container-content py-32 text-center">
                <p className="text-5xl font-bold text-gray-900 mb-4">404</p>
                <p className="text-gray-500 mb-8">Page not found.</p>
                <a href="/" className="btn-primary">Go home</a>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
