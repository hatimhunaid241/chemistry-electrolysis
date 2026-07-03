const PROGRESS_KEY = 'chem_elec_progress'
const AI_KEY = 'chem_elec_ai'
const DIFF_KEY = 'chem_elec_difficulty'

const DEFAULT_PROGRESS = {
  completedLessons: [],
  lessonScores: {},
  practiceStats: {
    total: 0,
    correct: 0,
    byTopic: {},
    byTopicCorrect: {},
    byDifficulty: {},
  },
  simsViewed: [],
}

// Default provider is OpenRouter with the free Llama 3.2 3B model, per spec.
const DEFAULT_AI = {
  provider: 'openrouter',
  model: 'meta-llama/llama-3.2-3b-instruct:free',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      practiceStats: { ...DEFAULT_PROGRESS.practiceStats, ...(parsed.practiceStats || {}) },
    }
  } catch { return { ...DEFAULT_PROGRESS } }
}

export function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

export function loadAISettings() {
  try {
    const raw = localStorage.getItem(AI_KEY)
    return raw ? { ...DEFAULT_AI, ...JSON.parse(raw) } : { ...DEFAULT_AI }
  } catch { return { ...DEFAULT_AI } }
}

export function saveAISettings(s) {
  try { localStorage.setItem(AI_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

// Adaptive difficulty is persisted per topic key as an integer percent (10..100).
export function loadDifficulties() {
  try {
    const raw = localStorage.getItem(DIFF_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveDifficulties(map) {
  try { localStorage.setItem(DIFF_KEY, JSON.stringify(map)) } catch { /* ignore */ }
}
