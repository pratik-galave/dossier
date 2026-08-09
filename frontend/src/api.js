const API_BASE = 'https://backend-2c42-8000.prg1.zerops.app'

export async function startSession(mode, company = null, difficulty = 'medium') {
  // Sanitise difficulty — must be exactly one of the three accepted values
  const validDifficulties = ['easy', 'medium', 'hard']
  const safeDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium'

  // Build payload — company is ONLY included when mode is "company" AND a name is provided
  const payload = {
    mode,
    difficulty: safeDifficulty,
  }
  if (mode === 'company' && company && company.trim()) {
    payload.company = company.trim()
  }

  // Debug: verify payload in browser console before every request
  console.log('[Dossier] startSession payload:', JSON.stringify(payload, null, 2))

  const res = await fetch(`${API_BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to start session (${res.status})`)
  }

  return await res.json()
}

export async function sendAnswer(sessionId, answer) {
  const res = await fetch(`${API_BASE}/api/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_answer: answer,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to send answer (${res.status})`)
  }

  return await res.json()
}

export async function endSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/session/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to end session (${res.status})`)
  }

  return await res.json()
}

export async function transcribeAudio(audioBlob, filename = 'audio.webm') {
  const formData = new FormData()
  formData.append('file', audioBlob, filename)

  const res = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to transcribe audio (${res.status})`)
  }

  return await res.json()
}
