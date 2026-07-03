import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useLang } from '../i18n/LanguageContext'
import { generateQuestion } from '../utils/ai'
import { CV } from '../simulations/simTheme'

const TOPICS = [
  { key: 'intro', en: 'Introduction — electrolytes & charge carriers', zh: '導論 —— 電解質與載流子' },
  { key: 'molten', en: 'Electrolysis of molten salts', zh: '熔融鹽的電解' },
  { key: 'aqueous', en: 'Electrolysis of aqueous CuSO₄ (inert vs active)', zh: '電解 CuSO₄(aq)（惰性與活性）' },
  { key: 'brine', en: 'Electrolysis of brine & the chlor-alkali process', zh: '電解鹽水與氯鹼法' },
  { key: 'h2so4', en: 'Dilute H₂SO₄ & gas ratios', zh: '稀 H₂SO₄ 與氣體比' },
  { key: 'faraday', en: "Faraday's laws — calculations", zh: '法拉第定律 —— 計算' },
  { key: 'factors', en: 'Factors affecting ion discharge', zh: '影響離子放電的因素' },
  { key: 'plating', en: 'Electroplating & copper purification', zh: '電鍍與銅的精煉' },
  { key: 'voltaic', en: 'Voltaic cells — electron flow & salt bridge', zh: '伏打電池 —— 電子流與鹽橋' },
  { key: 'daniel', en: 'Daniel cell & EMF', zh: '丹尼爾電池與電動勢' },
  { key: 'potentials', en: 'Standard electrode potentials & feasibility', zh: '標準電極電位與可行性' },
  { key: 'fuel', en: 'Fuel cells', zh: '燃料電池' },
  { key: 'mixed', en: 'Mixed — comprehensive HKDSE', zh: '綜合 —— HKDSE 全面題' },
]

function ProgressChart({ stats }) {
  const canvasRef = useRef(null)
  const { pick, t } = useLang()
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    const topics = Object.keys(stats.byTopic)
    if (topics.length === 0) {
      ctx.fillStyle = CV.textMuted; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(t('practice_empty_chart'), W / 2, H / 2)
      return
    }
    const barW = Math.min(46, (W - 80) / topics.length - 8)
    const maxVal = Math.max(...topics.map(k => stats.byTopic[k] || 0), 1)
    const chartH = H - 70
    topics.forEach((topic, i) => {
      const total = stats.byTopic[topic] || 0
      const correct = stats.byTopicCorrect[topic] || 0
      const x = 40 + i * ((W - 60) / topics.length) + (W - 60) / topics.length / 2 - barW / 2
      const barH = (total / maxVal) * chartH
      const correctH = total > 0 ? (correct / total) * barH : 0
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(x, H - 45 - barH, barW, barH)
      ctx.fillStyle = '#16a34a'; ctx.fillRect(x, H - 45 - correctH, barW, correctH)
      ctx.fillStyle = CV.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
      ctx.save(); ctx.translate(x + barW / 2, H - 32); ctx.rotate(-Math.PI / 6)
      ctx.fillText(String(topic).slice(0, 8), 0, 0); ctx.restore()
      ctx.fillStyle = CV.text; ctx.font = '10px sans-serif'
      ctx.fillText(`${correct}/${total}`, x + barW / 2, H - 48 - barH - 3)
    })
    ctx.strokeStyle = CV.axis; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(35, H - 45); ctx.lineTo(W - 10, H - 45); ctx.stroke()
    ctx.fillStyle = '#16a34a'; ctx.fillRect(W - 90, 10, 12, 10)
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(W - 90, 26, 12, 10)
    ctx.fillStyle = CV.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(t('practice_correct_n'), W - 74, 19); ctx.fillText(t('practice_total_q'), W - 74, 35)
    void pick
  }, [stats, pick, t])
  return <canvas ref={canvasRef} width={680} height={220} className="w-full rounded-xl border border-slate-200 bg-white" />
}

export default function PracticeTab() {
  const { aiSettings, progress, recordPractice, getDifficulty, setDifficulty, adjustDifficulty } = useApp()
  const { t, lang, pick } = useLang()
  const [topic, setTopic] = useState(TOPICS[0])
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selfMark, setSelfMark] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [session, setSession] = useState({ correct: 0, total: 0 })

  const diffKey = `ai_${topic.key}`
  const pct = getDifficulty(diffKey)
  const hasKey = aiSettings.apiKey || aiSettings.provider === 'ollama'

  const fetchQuestion = async () => {
    if (!hasKey) { setError(t('practice_need_key')); return }
    setLoading(true); setError(''); setQuestion(null); setAnswered(false)
    setSelected(null); setUserAnswer(''); setSelfMark(null); setShowHint(false); setHintIdx(0)
    try {
      const q = await generateQuestion(aiSettings, { topic: pick(topic), difficulty: pct, lang })
      if (!q || !q.question) throw new Error('Invalid question format from AI')
      setQuestion(q)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  const settle = (correct) => {
    setSession(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    recordPractice(correct, topic.key, pct)
    adjustDifficulty(diffKey, correct)
  }
  const handleMCQ = (opt) => { if (answered) return; setSelected(opt); setAnswered(true); settle(opt === question.answer) }
  const handleStructuredSubmit = () => { if (userAnswer.trim()) setAnswered(true) }
  const handleSelfMark = (correct) => { setSelfMark(correct); settle(correct) }

  const diffColor = pct <= 30 ? 'text-green-600' : pct <= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('practice_title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('practice_subtitle')}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">{session.correct}/{session.total}</div>
          <div className="text-xs text-slate-500">{t('practice_session')}</div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500 block mb-1">{t('practice_topic')}</label>
            <select value={topic.key} onChange={e => setTopic(TOPICS.find(x => x.key === e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
              {TOPICS.map(x => <option key={x.key} value={x.key}>{pick(x)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">{t('diff_label')}: <span className={`font-bold ${diffColor}`}>{pct}%</span></label>
            <div className="flex items-center gap-2">
              <button onClick={() => setDifficulty(diffKey, pct - 10)} disabled={pct <= 10} className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold">−</button>
              <input type="range" min={10} max={100} step={10} value={pct} onChange={e => setDifficulty(diffKey, +e.target.value)} className="control-slider" />
              <button onClick={() => setDifficulty(diffKey, pct + 10)} disabled={pct >= 100} className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold">+</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={fetchQuestion} disabled={loading || !hasKey}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2">
            {loading ? <><span className="animate-spin">⟳</span> {t('practice_generating')}</> : t('practice_generate')}
          </button>
          {!hasKey && <p className="text-sm text-amber-600">{t('practice_need_key')}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {question && (
        <div className="card mb-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${diffColor} border-current`}>{pct}%</span>
            <span className="text-xs text-slate-500">{question.type === 'mcq' ? t('practice_mcq') : t('practice_structured')}</span>
          </div>

          <p className="text-slate-800 font-medium mb-4 leading-relaxed">{question.question}</p>

          {question.parts && question.parts.map(p => (
            <div key={p.part} className="mb-3 ml-4">
              <p className="text-slate-700 mb-1"><span className="text-blue-600 font-bold">({p.part})</span> {p.question} <span className="text-slate-400 text-xs">[{p.marks} {p.marks > 1 ? t('practice_mark') : t('practice_mark_one')}]</span></p>
            </div>
          ))}

          {question.type === 'mcq' && question.options && (
            <div className="space-y-2 mb-4">
              {Object.entries(question.options).map(([opt, text]) => {
                let cls = 'border-slate-200 hover:border-slate-400 cursor-pointer'
                if (answered) {
                  if (opt === question.answer) cls = 'border-green-500 bg-green-50'
                  else if (opt === selected) cls = 'border-red-500 bg-red-50'
                  else cls = 'border-slate-200 opacity-40'
                } else if (opt === selected) cls = 'border-blue-500 bg-blue-50'
                return (
                  <div key={opt} onClick={() => handleMCQ(opt)} className={`flex gap-3 items-start border rounded-lg p-3 transition-all ${cls}`}>
                    <span className="font-bold text-slate-500 shrink-0">{opt}.</span>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                )
              })}
            </div>
          )}

          {question.type === 'structured' && !answered && (
            <div className="mb-4">
              <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} rows={4} placeholder={t('practice_write')}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none resize-none" />
              <button onClick={handleStructuredSubmit} disabled={!userAnswer.trim()} className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">{t('btn_check')}</button>
            </div>
          )}

          {question.hints && question.hints.length > 0 && !answered && (
            <div className="mb-3">
              {!showHint ? (
                <button onClick={() => setShowHint(true)} className="text-xs text-amber-600 hover:text-amber-500">{t('btn_show_hint')} ({question.hints.length})</button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-sm">
                  <p className="font-semibold text-xs mb-1">{hintIdx + 1}/{question.hints.length}</p>
                  <p>{question.hints[hintIdx]}</p>
                  {hintIdx < question.hints.length - 1 && <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-amber-700 hover:text-amber-600">{t('btn_next_hint')}</button>}
                </div>
              )}
            </div>
          )}

          {answered && question.type === 'structured' && (
            <div className="mb-4">
              <div className="bg-slate-100 rounded-lg p-3 mb-3 text-sm">
                <p className="text-slate-500 text-xs mb-1">{t('practice_your_ans')}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{userAnswer}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-3">
                <p className="text-green-700 font-semibold mb-1">{t('practice_model_ans')}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{question.answer}</p>
                {question.parts && question.parts.map(p => (
                  <div key={p.part} className="mt-2">
                    <p className="text-blue-700 text-xs font-semibold">({p.part})</p>
                    <p className="text-slate-700 text-sm">{p.answer}</p>
                  </div>
                ))}
              </div>
              {selfMark === null && (
                <div className="flex gap-3 items-center flex-wrap">
                  <span className="text-sm text-slate-500">{t('practice_self')}</span>
                  <button onClick={() => handleSelfMark(true)} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg">{t('btn_correct')}</button>
                  <button onClick={() => handleSelfMark(false)} className="bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg">{t('btn_incorrect')}</button>
                </div>
              )}
            </div>
          )}

          {answered && question.type === 'mcq' && question.explanation && (
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm">
              <span className="font-semibold text-blue-700">{t('practice_explanation')} </span>
              <span className="text-slate-700">{question.explanation}</span>
            </div>
          )}

          {answered && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              {question.type === 'mcq' && (
                <span className={`font-bold text-sm ${selected === question.answer ? 'text-green-600' : 'text-red-600'}`}>
                  {selected === question.answer ? t('practice_correct') : t('practice_incorrect')}
                </span>
              )}
              {question.type === 'structured' && selfMark !== null && (
                <span className={`font-bold text-sm ${selfMark ? 'text-green-600' : 'text-red-600'}`}>{selfMark ? t('practice_marked_c') : t('practice_marked_i')}</span>
              )}
              <button onClick={fetchQuestion} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl">{t('btn_next')}</button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">{t('practice_by_topic')}</h3>
        <ProgressChart stats={progress.practiceStats} />
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold text-slate-900">{progress.practiceStats.total}</div><div className="text-xs text-slate-500">{t('practice_total_q')}</div></div>
          <div><div className="text-2xl font-bold text-green-600">{progress.practiceStats.correct}</div><div className="text-xs text-slate-500">{t('practice_correct_n')}</div></div>
          <div><div className="text-2xl font-bold text-blue-600">{progress.practiceStats.total > 0 ? Math.round(progress.practiceStats.correct / progress.practiceStats.total * 100) : 0}%</div><div className="text-xs text-slate-500">{t('practice_accuracy')}</div></div>
        </div>
      </div>
    </div>
  )
}
