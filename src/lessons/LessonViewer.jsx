import React from 'react'
import Quiz from './Quiz'
import { useLang } from '../i18n/LanguageContext'

function ContentBlock({ block, pick }) {
  switch (block.type) {
    case 'heading':
      return <h3>{pick(block.text)}</h3>
    case 'text':
      return <p>{pick(block.text)}</p>
    case 'keyPoints':
      return (
        <div className="space-y-2 my-3">
          {block.items.map((item, i) => (
            <div key={i} className="key-point">
              <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
              <span className="text-sm">{pick(item)}</span>
            </div>
          ))}
        </div>
      )
    case 'equation':
      return (
        <div className="eq-box">
          {block.label && <div className="text-xs text-slate-500 mb-1">{pick(block.label)}</div>}
          <div>{block.text}</div>
        </div>
      )
    case 'warn':
      return <div className="warn-box"><span className="font-bold">⚠ </span>{pick(block.text)}</div>
    case 'info':
      return <div className="info-box"><span className="font-bold">💡 </span>{pick(block.text)}</div>
    case 'table':
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {block.headers.map((h, i) => (
                  <th key={i} className="border border-slate-200 px-3 py-2 text-left text-blue-700 font-semibold">{pick(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-slate-200 px-3 py-2 text-slate-700">{pick(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

export default function LessonViewer({ lesson, onComplete }) {
  const { t, pick } = useLang()
  const [showQuiz, setShowQuiz] = React.useState(false)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{lesson.icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{pick(lesson.title)}</h2>
          <p className="text-slate-500 text-sm">⏱ {lesson.time}</p>
        </div>
      </div>

      {!showQuiz ? (
        <>
          <article className="lesson-content card mb-6">
            {lesson.content.map((block, i) => <ContentBlock key={i} block={block} pick={pick} />)}
          </article>
          <div className="flex justify-end">
            <button onClick={() => setShowQuiz(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition">
              {t('btn_take_quiz')}
            </button>
          </div>
        </>
      ) : (
        <Quiz questions={lesson.quiz} lessonId={lesson.id} onComplete={onComplete} onBack={() => setShowQuiz(false)} />
      )}
    </div>
  )
}
