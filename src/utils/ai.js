const SYSTEM_PROMPT = `You are an expert HKDSE Chemistry tutor specialising in Electrolysis and Voltaic Cells. Generate exam-quality questions. Always respond with valid JSON only — no markdown, no commentary outside the JSON.`

const QUESTION_SCHEMA = `
Return EXACTLY this JSON shape (no other text):
{
  "type": "mcq" | "structured",
  "topic": "<topic string>",
  "difficulty": "<the difficulty label given>",
  "question": "<question text>",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },   // only for mcq
  "answer": "<A|B|C|D for mcq, or full model answer for structured>",
  "explanation": "<clear explanation of why the answer is correct>",
  "hints": ["<first hint>", "<second hint>"],
  "parts": [                                                        // only for structured
    { "part": "a", "question": "...", "marks": 2, "answer": "..." }
  ]
}`

// Map a 10..100 difficulty percentage to a concrete complexity instruction.
function difficultyBrief(pct) {
  if (pct <= 20) return { label: `${pct}% (very easy)`, brief: 'Very simple, single-step recall or one-step substitution using small round numbers. No multi-stage reasoning.' }
  if (pct <= 40) return { label: `${pct}% (easy)`, brief: 'Easy. A single clear concept or a one-step calculation with friendly numbers.' }
  if (pct <= 60) return { label: `${pct}% (standard)`, brief: 'Standard HKDSE Paper 1/2 difficulty. Two linked ideas or a two-step calculation.' }
  if (pct <= 80) return { label: `${pct}% (hard)`, brief: 'Challenging. Multi-step calculation or reasoning that combines two concepts, with less-friendly numbers.' }
  return { label: `${pct}% (very hard)`, brief: 'Very hard HKDSE extension. Multi-step, combined-concept reasoning or a calculation requiring several stages and awkward values.' }
}

/**
 * generateQuestion(settings, opts)
 *   opts = { topic, difficulty (10..100 int), lang ('en'|'zh'), type ('mixed'|'mcq'|'structured') }
 */
export async function generateQuestion(settings, opts = {}) {
  const { topic = 'Electrolysis', difficulty = 50, lang = 'en', type = 'mixed' } = opts
  const qType = type === 'mixed' ? (Math.random() > 0.5 ? 'mcq' : 'structured') : type
  const { label, brief } = difficultyBrief(difficulty)
  const langLine = lang === 'zh'
    ? 'Write ALL natural-language text (question, options, answer, explanation, hints) in Traditional Chinese (Hong Kong register). Keep chemical formulae, half-equations, units and scientific notation in standard notation (e.g. Cu²⁺, 2H₂O → O₂ + 4H⁺ + 4e⁻, 96 500 C mol⁻¹).'
    : 'Write all text in English.'

  const userPrompt = `Generate one ${qType} HKDSE Chemistry question about: ${topic}.
Difficulty target: ${label}. ${brief}
Context: HKDSE level, Hong Kong curriculum. Include balanced chemical/ionic equations where relevant. Randomise any numbers so the question is fresh.
${langLine}
${QUESTION_SCHEMA}`

  if (settings.provider === 'gemini') return callGemini(settings, userPrompt)
  if (settings.provider === 'openrouter') return callOpenRouter(settings, userPrompt)
  if (settings.provider === 'ollama') return callOllama(settings, userPrompt)
  throw new Error('Unknown provider')
}

async function callGemini({ apiKey, model }, prompt) {
  if (!apiKey) throw new Error('Missing Gemini API key')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const body = {
    contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 1400 },
  }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return parseJSON(text)
}

async function callOpenRouter({ apiKey, model }, prompt) {
  if (!apiKey) throw new Error('Missing OpenRouter API key')
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://hkdse-electrolysis.local',
      'X-Title': 'HKDSE Electrolysis Study Pack',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1400,
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
      options: { temperature: 0.8 },
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.message?.content ?? ''
  return parseJSON(text)
}

function parseJSON(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try { return JSON.parse(clean) }
  catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Could not parse AI response as JSON')
  }
}
