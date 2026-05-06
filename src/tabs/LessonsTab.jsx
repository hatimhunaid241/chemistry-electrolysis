import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LESSONS } from '../lessons/lessonData'
import LessonViewer from '../lessons/LessonViewer'

export default function LessonsTab() {
  const { progress } = useApp()
  const [active, setActive] = useState(null)

  const lesson = active !== null ? LESSONS[active] : null

  if (lesson) {
    return (
      <div>
        <button onClick={() => setActive(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
          ← Back to lessons
        </button>
        <LessonViewer lesson={lesson} onComplete={() => setActive(null)} />
      </div>
    )
  }

  const completed = progress.completedLessons
  const pct = Math.round((completed.length / LESSONS.length) * 100)

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lessons</h2>
          <p className="text-gray-500 text-sm mt-1">{completed.length}/{LESSONS.length} lessons completed</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{pct}%</div>
          <div className="text-xs text-gray-500">Overall progress</div>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LESSONS.map((lesson, i) => {
          const done = completed.includes(lesson.id)
          const score = progress.lessonScores[lesson.id]
          return (
            <button
              key={lesson.id}
              onClick={() => setActive(i)}
              className={`card text-left hover:border-blue-600 transition-all group ${done ? 'border-green-800/60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{lesson.icon}</span>
                <div className="flex items-center gap-2">
                  {done && <span className="text-green-400 text-xs font-semibold bg-green-950/50 border border-green-800/50 px-2 py-0.5 rounded-full">✓ Done</span>}
                  <span className="text-xs text-gray-600">{lesson.time}</span>
                </div>
              </div>
              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">{lesson.title}</h3>
              {score !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Best score: <span className={score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}>{score}%</span></p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
