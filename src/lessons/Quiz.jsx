import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useLang } from '../i18n/LanguageContext'

function MCQQuestion({ q, index, onAnswer, answered }) {
  const { t, pick } = useLang()
  const [selected, setSelected] = useState(null)
  const [showHints, setShowHints] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)

  const handleSelect = (opt) => {
    if (answered) return
    setSelected(opt)
    onAnswer(opt === q.answer)
  }

  const optColors = (opt) => {
    if (!answered) return opt === selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-400 cursor-pointer'
    if (opt === q.answer) return 'border-green-500 bg-green-50'
    if (opt === selected) return 'border-red-500 bg-red-50'
    return 'border-slate-200 opacity-50'
  }

  return (
    <div className="mb-2">
      <p className="text-slate-800 font-medium mb-3"><span className="text-blue-600 font-bold">Q{index + 1}.</span> {pick(q.question)}</p>
      <div className="space-y-2 mb-3">
        {Object.entries(q.options).map(([opt, text]) => (
          <div key={opt} onClick={() => handleSelect(opt)} className={`flex items-start gap-3 border rounded-lg p-3 transition-all ${optColors(opt)} ${!answered ? 'cursor-pointer' : ''}`}>
            <span className={`font-bold shrink-0 ${opt === q.answer && answered ? 'text-green-600' : 'text-slate-500'}`}>{opt}.</span>
            <span className="text-sm text-slate-700">{pick(text)}</span>
          </div>
        ))}
      </div>
      {q.hints && q.hints.length > 0 && !answered && (
        <div className="mt-2">
          {!showHints ? (
            <button onClick={() => setShowHints(true)} className="text-xs text-amber-600 hover:text-amber-500">{t('btn_show_hint')}</button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-sm">
              <p className="font-semibold mb-1">{index + 1} · {hintIdx + 1}/{q.hints.length}</p>
              <p>{pick(q.hints[hintIdx])}</p>
              {hintIdx < q.hints.length - 1 && <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-amber-700 hover:text-amber-600">{t('btn_next_hint')}</button>}
            </div>
          )}
        </div>
      )}
      {answered && (
        <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-700 border border-slate-200">
          <span className="font-semibold text-blue-700">{t('practice_explanation')} </span>{pick(q.explanation)}
        </div>
      )}
    </div>
  )
}

function StructuredQuestion({ q, index, onAnswer, answered }) {
  const { t, pick } = useLang()
  const [userAnswer, setUserAnswer] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [selfMark, setSelfMark] = useState(null)

  const submit = () => { if (userAnswer.trim()) setSubmitted(true) }
  const handleSelfMark = (correct) => { setSelfMark(correct); onAnswer(correct) }

  return (
    <div className="mb-2">
      <p className="text-slate-800 font-medium mb-3"><span className="text-blue-600 font-bold">Q{index + 1}.</span> {pick(q.question)}</p>
      {!submitted ? (
        <>
          <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder={t('practice_write')} rows={4}
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none resize-none" />
          {q.hints && q.hints.length > 0 && (
            <div className="mt-2">
              {!showHints ? (
                <button onClick={() => setShowHints(true)} className="text-xs text-amber-600 hover:text-amber-500">{t('btn_show_hint')}</button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-sm mb-2">
                  <p className="font-semibold mb-1">{hintIdx + 1}/{q.hints.length}</p>
                  <p>{pick(q.hints[hintIdx])}</p>
                  {hintIdx < q.hints.length - 1 && <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-amber-700 hover:text-amber-600">{t('btn_next_hint')}</button>}
                </div>
              )}
            </div>
          )}
          <button onClick={submit} disabled={!userAnswer.trim()} className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">{t('btn_check')}</button>
        </>
      ) : (
        <div>
          <div className="bg-slate-100 rounded-lg p-3 mb-3 text-sm">
            <p className="text-slate-500 text-xs mb-1">{t('practice_your_ans')}</p>
            <p className="text-slate-700 whitespace-pre-wrap">{userAnswer}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-3">
            <p className="text-green-700 font-semibold mb-1">{t('practice_mark_scheme')}</p>
            <p className="text-slate-700 whitespace-pre-wrap">{pick(q.answer)}</p>
          </div>
          {selfMark === null ? (
            <div className="flex gap-3 items-center flex-wrap">
              <p className="text-sm text-slate-500 mr-2">{t('practice_self')}</p>
              <button onClick={() => handleSelfMark(true)} className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg">{t('btn_correct')}</button>
              <button onClick={() => handleSelfMark(false)} className="text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded-lg">{t('btn_incorrect')}</button>
            </div>
          ) : (
            <p className={`text-sm font-semibold ${selfMark ? 'text-green-600' : 'text-red-600'}`}>{selfMark ? t('practice_marked_c') : t('practice_marked_i')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Quiz({ questions, lessonId, onComplete, onBack }) {
  const { markLessonComplete } = useApp()
  const { t } = useLang()
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const handleAnswer = (qId, correct) => setAnswers(prev => ({ ...prev, [qId]: correct }))
  const allAnswered = questions.every(q => q.id in answers)
  const score = Math.round((Object.values(answers).filter(Boolean).length / questions.length) * 100)

  const finish = () => { markLessonComplete(lessonId, score); setFinished(true) }

  if (finished) {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-4">{score >= 80 ? '🏆' : score >= 60 ? '👍' : '📖'}</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('quiz_complete')}</h3>
        <p className="text-slate-500 mb-4">{t('quiz_you_scored')} <span className={`font-bold text-2xl ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span></p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-xl">{t('btn_back_lesson')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{t('quiz_title')}</h3>
        <span className="text-sm text-slate-500">{Object.keys(answers).length}/{questions.length} {t('quiz_answered')}</span>
      </div>
      <div className="space-y-6 divide-y divide-slate-100">
        {questions.map((q, i) => (
          <div key={q.id} className="pt-5 first:pt-0">
            {q.type === 'mcq'
              ? <MCQQuestion q={q} index={i} onAnswer={(c) => handleAnswer(q.id, c)} answered={q.id in answers} />
              : <StructuredQuestion q={q} index={i} onAnswer={(c) => handleAnswer(q.id, c)} answered={q.id in answers} />}
          </div>
        ))}
      </div>
      {allAnswered && (
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button onClick={finish} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl">{t('btn_finish_save')}</button>
        </div>
      )}
    </div>
  )
}
