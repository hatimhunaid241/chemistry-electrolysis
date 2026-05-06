const SYSTEM_PROMPT = `You are an expert HKDSE Chemistry tutor specialising in Electrolysis and Voltaic Cells. Generate exam-quality questions. Always respond with valid JSON only, no markdown, no explanation outside the JSON.`

const QUESTION_SCHEMA = `
Return EXACTLY this JSON shape (no other text):
{
  "type": "mcq" | "structured",
  "topic": "<topic string>",
  "difficulty": "easy" | "medium" | "hard",
  "question": "<question text>",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },   // only for mcq
  "answer": "<A|B|C|D for mcq, or model answer for structured>",
  "explanation": "<clear explanation of why the answer is correct>",
  "hints": ["<first hint>", "<second hint>"],
  "parts": [                                                        // only for structured
    { "part": "a", "question": "...", "marks": 2, "answer": "..." },
    { "part": "b", "question": "...", "marks": 3, "answer": "..." }
  ]
}`

export async function generateQuestion(settings, topic, difficulty, type = 'mixed') {
  const qType = type === 'mixed' ? (Math.random() > 0.5 ? 'mcq' : 'structured') : type
  const userPrompt = `Generate one ${difficulty} ${qType} HKDSE Chemistry question about: ${topic}.
Context: HKDSE level, Hong Kong curriculum. Go deeper if "hard". Include chemical equations where relevant.
${QUESTION_SCHEMA}`

  if (settings.provider === 'gemini') return callGemini(settings, userPrompt)
  if (settings.provider === 'openrouter') return callOpenRouter(settings, userPrompt)
  if (settings.provider === 'ollama') return callOllama(settings, userPrompt)
  throw new Error('Unknown provider')
}

async function callGemini({ apiKey, model }, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
  }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return parseJSON(text)
}

async function callOpenRouter({ apiKey, model }, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://chemistry-electrolysis.local',
      'X-Title': 'HKDSE Electrolysis Study Pack',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return parseJSON(text)
}

async function callOllama({ ollamaUrl, model }, prompt) {
  const base = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '')
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { temperature: 0.7 },
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.message?.content ?? ''
  return parseJSON(text)
}

function parseJSON(text) {
  // strip markdown code fences if present
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try { return JSON.parse(clean) }
  catch {
    // try to extract first { ... } block
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Could not parse AI response as JSON')
  }
}
