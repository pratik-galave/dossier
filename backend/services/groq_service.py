"""
Groq LLM service — wraps all calls to the Groq API.

Model: llama-3.1-70b-versatile
"""

from groq import AsyncGroq
from config import settings

# Single shared async client
_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


# ── System prompt builders ────────────────────────────────────────────────────

def build_system_prompt(
    mode: str,
    company: str | None = None,
    rag_context: list[str] | None = None,
) -> str:
    """
    Return the system prompt for the given interview mode.
    rag_context: list of text chunks retrieved from ChromaDB (company mode only).
    """
    base = """You are Dossier, a sharp and demanding AI interview coach conducting a mock interview.

Rules you MUST follow:
- NEVER say "great answer", "excellent", "well done", or give empty praise.
- Be concise. Every response must be at most 3 sentences — this is a voice conversation.
- Ask exactly ONE question per turn. Either a follow-up if the answer was weak, or the next topic.
- If the candidate's answer is vague, incomplete, or wrong — probe deeper before moving on.
- If the answer is strong and complete — acknowledge briefly (one sentence max), then move to the next topic.
- Never repeat a question already asked.
- Do not explain what you're about to do. Just do it.
- Do not add disclaimers or caveats. Speak directly like a real interviewer."""

    if mode == "technical":
        return base + """

Interview focus: Software engineering — data structures, algorithms, system design, coding patterns.
Probe for: time/space complexity, trade-offs, real-world scaling, edge cases."""

    elif mode == "hr":
        return base + """

Interview focus: Behavioural and situational questions using the STAR method.
Probe for: specific situations, measurable impact, conflict resolution, leadership behaviour.
Push back on generic answers — demand specific examples."""

    elif mode == "company":
        company_line = f"The candidate is interviewing at: {company.title() if company else 'a company'}." 

        # Inject RAG-retrieved context if available
        rag_block = ""
        if rag_context:
            formatted = "\n".join(f"- {chunk}" for chunk in rag_context)
            rag_block = f"""

Known patterns and context for this company (retrieved from knowledge base):
{formatted}

Use this context to ask hyper-relevant, company-specific questions."""

        return base + f"""

Interview focus: Company-specific and role-fit questions. {company_line}
Probe for: alignment with the company's known values and culture, product knowledge, why this company.{rag_block}"""

    return base


def build_opening_question(
    mode: str,
    company: str | None = None,
    rag_context: list[str] | None = None,
) -> tuple[list[dict], str]:
    """
    Messages list to send to Groq to generate the first interview question.
    """
    system = build_system_prompt(mode, company, rag_context)
    user_prompt = (
        "Begin the interview. Introduce yourself in one sentence and ask the first question immediately."
    )
    return [{"role": "user", "content": user_prompt}], system


# ── API call helpers ──────────────────────────────────────────────────────────

MODEL = "llama-3.3-70b-versatile"


async def generate_first_question(
    mode: str,
    company: str | None = None,
    rag_context: list[str] | None = None,
) -> str:
    """Call Groq to produce the opening question for a new session."""
    client = get_groq_client()
    messages, system_prompt = build_opening_question(mode, company, rag_context)

    completion = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system_prompt}] + messages,
        temperature=0.7,
        max_tokens=200,
    )
    return completion.choices[0].message.content.strip()


async def generate_follow_up(
    mode: str,
    company: str | None,
    history: list[dict],   # list of {"role": "user"|"assistant", "content": str}
    user_answer: str,
    rag_context: list[str] | None = None,
) -> str:
    """
    Call Groq with the full conversation history + the new user answer.
    Returns the AI's next question/response.
    """
    client = get_groq_client()
    system_prompt = build_system_prompt(mode, company, rag_context)

    # Build messages: history (already formatted) + new user turn
    messages = history + [{"role": "user", "content": user_answer}]

    completion = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system_prompt}] + messages,
        temperature=0.7,
        max_tokens=200,
    )
    return completion.choices[0].message.content.strip()


async def generate_debrief(
    mode: str,
    company: str | None,
    history: list[dict],
) -> dict:
    """
    Send the full session transcript to Groq and ask for a structured debrief.
    Returns a dict with: overall_score, strong_areas, weak_areas, improvement_tips.
    """
    client = get_groq_client()

    # Build a readable transcript string
    transcript_lines = []
    for msg in history:
        speaker = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        transcript_lines.append(f"{speaker}: {msg['content']}")
    transcript_text = "\n".join(transcript_lines)

    debrief_prompt = f"""You have just conducted a {mode} interview.
Here is the full transcript:

{transcript_text}

---

Evaluate the candidate's overall performance and respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:

{{
  "overall_score": <integer 0-100>,
  "strong_areas": ["<area>", ...],
  "weak_areas": ["<area>", ...],
  "improvement_tips": ["<actionable tip>", ...]
}}

Be honest and critical. Score 60+ only if answers were genuinely strong."""

    completion = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": debrief_prompt}],
        temperature=0.3,
        max_tokens=600,
    )

    raw = completion.choices[0].message.content.strip()

    # Parse JSON — strip accidental markdown fences if present
    import json, re
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())

    # Fallback structure if parsing fails
    return {
        "overall_score": 50,
        "strong_areas": ["Could not parse model response"],
        "weak_areas": [],
        "improvement_tips": [],
    }
