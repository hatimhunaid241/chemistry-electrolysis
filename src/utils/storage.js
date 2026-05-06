const PROGRESS_KEY = 'chem_elec_progress'
const AI_KEY = 'chem_elec_ai'

const DEFAULT_PROGRESS = {
  completedLessons: [],
  lessonScores: {},
  practiceStats: {
    total: 0,
    correct: 0,
    byTopic: {},
    byTopicCorrect: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
  },
  simsViewed: [],
}

const DEFAULT_AI = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : { ...DEFAULT_PROGRESS }
  } catch { return { ...DEFAULT_PROGRESS } }
}

export function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) } catch {}
}

export function loadAISettings() {
  try {
    const raw = localStorage.getItem(AI_KEY)
    return raw ? { ...DEFAULT_AI, ...JSON.parse(raw) } : { ...DEFAULT_AI }
  } catch { return { ...DEFAULT_AI } }
}

export function saveAISettings(s) {
  try { localStorage.setItem(AI_KEY, JSON.stringify(s)) } catch {}
}
