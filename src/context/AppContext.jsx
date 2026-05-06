import React, { createContext, useContext, useState, useEffect } from 'react'
import { loadProgress, saveProgress, loadAISettings, saveAISettings } from '../utils/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [aiSettings, setAISettingsState] = useState(() => loadAISettings())
  const [progress, setProgressState] = useState(() => loadProgress())

  const setAISettings = (s) => {
    setAISettingsState(s)
    saveAISettings(s)
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
      byDiff[difficulty] = (byDiff[difficulty] ?? 0) + 1
      const next = {
        ...prev,
        practiceStats: {
          ...ps,
          total: ps.total + 1,
          correct: ps.correct + (correct ? 1 : 0),
          byTopic,
          byTopicCorrect,
          byDifficulty: byDiff,
        }
      }
      saveProgress(next)
      return next
    })
  }

  const markSimViewed = (simId) => {
    setProgressState(prev => {
      if (prev.simsViewed.includes(simId)) return prev
      const next = { ...prev, simsViewed: [...prev.simsViewed, simId] }
      saveProgress(next)
      return next
    })
  }

  return (
    <AppContext.Provider value={{ aiSettings, setAISettings, progress, markLessonComplete, recordPractice, markSimViewed }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
