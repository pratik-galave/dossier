const API_BASE = 'https://backend-2c42-8000.prg1.zerops.app/api'

export async function startSession(mode, company = null) {
  const payload = {
    mode,
    difficulty: 'mid',
  }
  if (mode === 'company' && company) {
    payload.company = company
  }

  const res = await fetch(`${API_BASE}/session/start`, {
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
  const res = await fetch(`${API_BASE}/respond`, {
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
  const res = await fetch(`${API_BASE}/session/end`, {
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

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to transcribe audio (${res.status})`)
  }

  return await res.json()
}
