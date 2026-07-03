import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useLang } from '../i18n/LanguageContext'

// Adaptive comprehension check.
// props: topicKey (string), generators (array of (pct)=>bilingual MCQ)
// A bilingual MCQ is { question:{en,zh}, options:[{en,zh}], answer:<index>, explanation:{en,zh} }
export default function AdaptiveQuestions({ topicKey, generators }) {
  const { getDifficulty, setDifficulty, adjustDifficulty } = useApp()
  const { t, pick } = useLang()
  const pct = getDifficulty(topicKey)

  const [q, setQ] = useState(null)
  const [picked, setPicked] = useState(null)

  // Keep the latest generate() in a ref so effects don't re-fire when the
  // difficulty (and thus getDifficulty's identity) changes after answering.
  const genRef = useRef(() => {})
  genRef.current = () => {
    const idx = Math.floor(Math.random() * generators.length)
    setQ(generators[idx](getDifficulty(topicKey)))
    setPicked(null)
  }

  // Generate only when the topic (or its question pool) changes.
  useEffect(() => { genRef.current() }, [topicKey, generators])

  const newQuestion = () => genRef.current()

  const answer = (i) => {
    if (picked !== null) return
    setPicked(i)
    adjustDifficulty(topicKey, i === q.answer)
  }

  // Manual difficulty change regenerates only when the current question is unanswered.
  const changeDiff = (value) => {
    setDifficulty(topicKey, value)
    if (picked === null) setTimeout(() => genRef.current(), 0)
  }

  if (!q) return null
  const answered = picked !== null
  const correct = picked === q.answer
  const diffColor = pct <= 30 ? 'text-green-600' : pct <= 60 ? 'text-amber-600' : 'text-red-600'
  const diffHint = pct <= 30 ? t('diff_hint_low') : pct <= 60 ? t('diff_hint_mid') : t('diff_hint_high')

  return (
    <div>
      <div className="flex items-center flex-wrap gap-3 mb-4">
        <span className="text-sm text-slate-600">{t('diff_label')}:</span>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDiff(pct - 10)} disabled={pct <= 10} aria-label={t('diff_decrease')}
            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold">−</button>
          <div className="w-40">
            <input type="range" min={10} max={100} step={10} value={pct} onChange={e => changeDiff(+e.target.value)} className="control-slider" />
          </div>
          <button onClick={() => changeDiff(pct + 10)} disabled={pct >= 100} aria-label={t('diff_increase')}
            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold">+</button>
        </div>
        <span className={`text-sm font-bold ${diffColor}`}>{pct}%</span>
        <span className="text-xs text-slate-400">({diffHint})</span>
      </div>

      <p className="text-slate-800 font-medium mb-3">{pick(q.question)}</p>
      <div className="space-y-2 mb-3">
        {q.options.map((o, i) => {
          let cls = 'border-slate-200 hover:border-slate-400 cursor-pointer'
          if (answered) {
            if (i === q.answer) cls = 'border-green-500 bg-green-50'
            else if (i === picked) cls = 'border-red-500 bg-red-50'
            else cls = 'border-slate-200 opacity-50'
          }
          return (
            <div key={i} onClick={() => answer(i)} className={`flex items-start gap-3 border rounded-lg p-3 text-sm transition-all ${cls}`}>
              <span className="font-bold text-slate-500 shrink-0">{String.fromCharCode(65 + i)}.</span>
              <span className="text-slate-700">{pick(o)}</span>
              {answered && i === q.answer && <span className="ml-auto text-green-600 text-xs">✓</span>}
              {answered && i === picked && i !== q.answer && <span className="ml-auto text-red-600 text-xs">✗</span>}
            </div>
          )
        })}
      </div>

      {answered ? (
        <>
          <div className={`rounded-lg p-3 text-sm border ${correct ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className={`font-semibold ${correct ? 'text-green-700' : 'text-amber-700'}`}>{correct ? t('practice_correct') : t('practice_incorrect')} </span>
            <span className="text-slate-700">{pick(q.explanation)}</span>
            <p className="text-xs text-slate-500 mt-1">{correct ? t('diff_auto_up') : t('diff_auto_down')} → {getDifficulty(topicKey)}%</p>
          </div>
          <button onClick={newQuestion} className="mt-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg">{t('btn_new_question')}</button>
        </>
      ) : (
        <button onClick={newQuestion} className="mt-1 text-xs text-slate-500 hover:text-slate-700">↻ {t('btn_new_question')}</button>
      )}
    </div>
  )
}
