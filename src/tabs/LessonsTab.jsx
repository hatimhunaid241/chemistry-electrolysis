import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useLang } from '../i18n/LanguageContext'
import { LESSONS } from '../lessons/lessonData'
import LessonViewer from '../lessons/LessonViewer'

export default function LessonsTab() {
  const { progress } = useApp()
  const { t, pick } = useLang()
  const [active, setActive] = useState(null)

  const lesson = active !== null ? LESSONS[active] : null

  if (lesson) {
    return (
      <div>
        <button onClick={() => setActive(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm">
          {t('btn_back_lessons')}
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
          <h2 className="text-2xl font-bold text-slate-900">{t('lessons_title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{completed.length}/{LESSONS.length} {t('lessons_done_of')}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{pct}%</div>
          <div className="text-xs text-slate-500">{t('lessons_overall')}</div>
        </div>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LESSONS.map((lesson, i) => {
          const done = completed.includes(lesson.id)
          const score = progress.lessonScores[lesson.id]
          return (
            <button key={lesson.id} onClick={() => setActive(i)}
              className={`card text-left hover:border-blue-400 hover:shadow-md transition-all group ${done ? 'border-green-300' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{lesson.icon}</span>
                <div className="flex items-center gap-2">
                  {done && <span className="text-green-700 text-xs font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{t('lessons_done_tag')}</span>}
                  <span className="text-xs text-slate-400">{lesson.time}</span>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{pick(lesson.title)}</h3>
              {score !== undefined && (
                <p className="text-xs text-slate-500 mt-1">{t('lessons_best')} <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}>{score}%</span></p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
