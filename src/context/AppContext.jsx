import React, { createContext, useContext, useState } from 'react'
import { loadProgress, saveProgress, loadAISettings, saveAISettings, loadDifficulties, saveDifficulties } from '../utils/storage'

const AppContext = createContext(null)

const clampDiff = (v) => Math.max(10, Math.min(100, Math.round(v / 10) * 10))

export function AppProvider({ children }) {
  const [aiSettings, setAISettingsState] = useState(() => loadAISettings())
  const [progress, setProgressState] = useState(() => loadProgress())
  const [difficulties, setDifficultiesState] = useState(() => loadDifficulties())

  const setAISettings = (s) => { setAISettingsState(s); saveAISettings(s) }

  // Adaptive difficulty per topic key (10..100). Defaults to 50%.
  const getDifficulty = (key) => difficulties[key] ?? 50
  const setDifficulty = (key, value) => {
    setDifficultiesState(prev => {
      const next = { ...prev, [key]: clampDiff(value) }
      saveDifficulties(next)
      return next
    })
  }
  const adjustDifficulty = (key, correct) => {
    setDifficultiesState(prev => {
      const cur = prev[key] ?? 50
      const next = { ...prev, [key]: clampDiff(cur + (correct ? 10 : -10)) }
      saveDifficulties(next)
      return next
    })
  }

  const markLessonComplete = (lessonId, score) => {
    setProgressState(prev => {
      const next = {
        ...prev,
        completedLessons: [...new Set([...prev.completedLessons, lessonId])],
        lessonScores: { ...prev.lessonScores, [lessonId]: Math.max(prev.lessonScores[lessonId] ?? 0, score) },
      }
      saveProgress(next)
      return next
    })
  }

  const recordPractice = (correct, topic, difficulty) => {
    setProgressState(prev => {
      const ps = prev.practiceStats
      const byTopic = { ...ps.byTopic }
      const byTopicCorrect = { ...ps.byTopicCorrect }
      const byDiff = { ...ps.byDifficulty }
      byTopic[topic] = (byTopic[topic] ?? 0) + 1
      byTopicCorrect[topic] = (byTopicCorrect[topic] ?? 0) + (correct ? 1 : 0)
      const dkey = String(difficulty)
      byDiff[dkey] = (byDiff[dkey] ?? 0) + 1
      const next = {
        ...prev,
        practiceStats: {
          ...ps,
          total: ps.total + 1,
          correct: ps.correct + (correct ? 1 : 0),
          byTopic, byTopicCorrect, byDifficulty: byDiff,
        },
      }
      saveProgress(next)
      return next
    })
  }

  return (
    <AppContext.Provider value={{
      aiSettings, setAISettings,
      progress, markLessonComplete, recordPractice,
      getDifficulty, setDifficulty, adjustDifficulty,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
