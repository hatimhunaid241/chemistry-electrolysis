import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { generateQuestion } from '../utils/ai'

const TOPICS = [
  'Introduction to Electrolysis — electrolytes, charge carriers, electrolytic cell setup',
  'Electrolysis of Molten Salts — PbBr₂, NaCl, MgCl₂',
  'Electrolysis of Aqueous CuSO₄ — inert vs active electrodes',
  'Electrolysis of Brine — products, concentration effect, chlor-alkali process',
  'Electrolysis of Dilute H₂SO₄ — Hoffman voltameter, gas ratios',
  "Faraday's Laws — quantitative calculations, current, time, mass",
  'Factors Affecting Ion Discharge — electrochemical series, concentration, electrode type',
  'Electroplating — setup, anode/cathode, industrial applications',
  'Purification of Copper — electrolytic refining, anode slime',
  'Voltaic Cells — principles, anode/cathode, electron flow, salt bridge',
  'Daniel Cell — construction, EMF calculation, Nernst effect',
  'Standard Electrode Potentials — E° values, predicting cell EMF, feasibility',
  'Fuel Cells — hydrogen-oxygen, alkaline vs acidic, advantages',
  'Mixed Topics — comprehensive HKDSE style',
]

const DIFFICULTIES = ['easy', 'medium', 'hard']

function ProgressChart({ stats }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    const topics = Object.keys(stats.byTopic)
    if (topics.length === 0) {
      ctx.fillStyle = '#4b5563'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Complete practice questions to see your progress', W / 2, H / 2)
      return
    }

    const barW = Math.min(50, (W - 80) / topics.length - 8)
    const maxVal = Math.max(...topics.map(t => stats.byTopic[t] || 0), 1)
    const chartH = H - 70

    topics.forEach((topic, i) => {
      const total = stats.byTopic[topic] || 0
      const correct = stats.byTopicCorrect[topic] || 0
      const x = 40 + i * ((W - 60) / topics.length) + (W - 60) / topics.length / 2 - barW / 2
      const barH = (total / maxVal) * chartH
      const correctH = total > 0 ? (correct / total) * barH : 0

      // Total bar (gray)
      ctx.fillStyle = '#374151'
      ctx.fillRect(x, H - 45 - barH, barW, barH)
      // Correct portion (green)
      ctx.fillStyle = '#16a34a'
      ctx.fillRect(x, H - 45 - correctH, barW, correctH)

      // Short topic label
      const shortLabel = topic.split(' ')[0].replace('—', '').trim().slice(0, 8)
      ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
      ctx.save(); ctx.translate(x + barW / 2, H - 32); ctx.rotate(-Math.PI / 6)
      ctx.fillText(shortLabel, 0, 0); ctx.restore()

      // Count
      ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'
      ctx.fillText(`${correct}/${total}`, x + barW / 2, H - 48 - barH - 3)
    })

    // Axes
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(35, H - 45); ctx.lineTo(W - 10, H - 45); ctx.stroke()

    // Legend
    ctx.fillStyle = '#16a34a'; ctx.fillRect(W - 90, 10, 12, 10)
    ctx.fillStyle = '#374151'; ctx.fillRect(W - 90, 26, 12, 10)
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText('Correct', W - 74, 19); ctx.fillText('Total', W - 74, 35)
  }, [stats])

  return <canvas ref={canvasRef} width={700} height={220} className="w-full rounded-xl border border-gray-800" />
}

export default function PracticeTab() {
  const { aiSettings, progress, recordPractice } = useApp()
  const [topic, setTopic] = useState(TOPICS[0])
  const [difficulty, setDifficulty] = useState('medium')
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [selfMark, setSelfMark] = useState(null)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })

  const hasKey = aiSettings.apiKey || aiSettings.provider === 'ollama'

  const fetchQuestion = async () => {
    if (!hasKey) { setError('Please configure your AI API key in AI Settings.'); return }
    setLoading(true); setError(''); setQuestion(null); setAnswered(false)
    setSelected(null); setUserAnswer(''); setShowExplanation(false); setHintIdx(0); setShowHint(false); setSelfMark(null)
    try {
      const q = await generateQuestion(aiSettings, topic, difficulty)
      if (!q || !q.question) throw new Error('Invalid question format from AI')
      setQuestion(q)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMCQSelect = (opt) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    const correct = opt === question.answer
    setSessionStats(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    recordPractice(correct, topic, difficulty)
  }

  const handleStructuredSubmit = () => {
    if (!userAnswer.trim()) return
    setAnswered(true)
    setShowExplanation(true)
  }

  const handleSelfMark = (correct) => {
    setSelfMark(correct)
    setSessionStats(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    recordPractice(correct, topic, difficulty)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Practice</h2>
          <p className="text-gray-500 text-sm mt-1">AI-generated HKDSE-style questions on demand</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-400">{sessionStats.correct}/{sessionStats.total}</div>
          <div className="text-xs text-gray-500">This session</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Topic</label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none">
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${difficulty === d ? { easy: 'bg-green-700 border-green-600 text-white', medium: 'bg-yellow-700 border-yellow-600 text-white', hard: 'bg-red-800 border-red-700 text-white' }[d] : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchQuestion} disabled={loading || !hasKey}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2">
            {loading ? <><span className="animate-spin">⟳</span> Generating…</> : '✦ Generate Question'}
          </button>
          {!hasKey && <p className="text-sm text-yellow-500">⚠ Set your API key in AI Settings first</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* Question display */}
      {question && (
        <div className="card mb-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize border ${{ easy: 'bg-green-950 border-green-700 text-green-400', medium: 'bg-yellow-950 border-yellow-700 text-yellow-400', hard: 'bg-red-950 border-red-700 text-red-400' }[question.difficulty ?? difficulty]}`}>
              {question.difficulty ?? difficulty}
            </span>
            <span className="text-xs text-gray-500">{question.type === 'mcq' ? 'Multiple Choice' : 'Structured'}</span>
            {question.topic && <span className="text-xs text-gray-600 truncate">{question.topic}</span>}
          </div>

          <p className="text-gray-200 font-medium mb-4 leading-relaxed">{question.question}</p>

          {/* Parts for structured */}
          {question.parts && question.parts.map(p => (
            <div key={p.part} className="mb-3 ml-4">
              <p className="text-gray-300 mb-1"><span className="text-blue-400 font-bold">({p.part})</span> {p.question} <span className="text-gray-600 text-xs">[{p.marks} mark{p.marks > 1 ? 's' : ''}]</span></p>
            </div>
          ))}

          {/* MCQ options */}
          {question.type === 'mcq' && question.options && (
            <div className="space-y-2 mb-4">
              {Object.entries(question.options).map(([opt, text]) => {
                let cls = 'border-gray-700 hover:border-gray-500 cursor-pointer'
                if (answered) {
                  if (opt === question.answer) cls = 'border-green-500 bg-green-950/30'
                  else if (opt === selected) cls = 'border-red-500 bg-red-950/30'
                  else cls = 'border-gray-800 opacity-40'
                } else if (opt === selected) cls = 'border-blue-500 bg-blue-950/30'
                return (
                  <div key={opt} onClick={() => handleMCQSelect(opt)} className={`flex gap-3 items-start border rounded-lg p-3 transition-all ${cls} ${!answered ? 'cursor-pointer' : ''}`}>
                    <span className="font-bold text-gray-400 shrink-0">{opt}.</span>
                    <span className="text-sm text-gray-300">{text}</span>
                    {answered && opt === question.answer && <span className="ml-auto text-green-400 text-xs">✓ Correct</span>}
                    {answered && opt === selected && opt !== question.answer && <span className="ml-auto text-red-400 text-xs">✗</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Structured answer */}
          {question.type === 'structured' && !answered && (
            <div className="mb-4">
              <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} rows={4} placeholder="Write your answer here…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none resize-none" />
              <button onClick={handleStructuredSubmit} disabled={!userAnswer.trim()}
                className="mt-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">Check Answer</button>
            </div>
          )}

          {/* Hints */}
          {question.hints && question.hints.length > 0 && !answered && (
            <div className="mb-3">
              {!showHint ? (
                <button onClick={() => setShowHint(true)} className="text-xs text-yellow-500 hover:text-yellow-400">💡 Show hint ({question.hints.length} available)</button>
              ) : (
                <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-3 text-yellow-200 text-sm">
                  <p className="font-semibold text-xs mb-1">Hint {hintIdx + 1}/{question.hints.length}</p>
                  <p>{question.hints[hintIdx]}</p>
                  {hintIdx < question.hints.length - 1 && (
                    <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-yellow-400 hover:text-yellow-300">Next hint →</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Structured answer reveal */}
          {answered && question.type === 'structured' && (
            <div className="mb-4">
              <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">Your answer:</p>
                <p className="text-gray-300 whitespace-pre-wrap">{userAnswer}</p>
              </div>
              <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 text-sm mb-3">
                <p className="text-green-300 font-semibold mb-1">Model Answer:</p>
                <p className="text-gray-300 whitespace-pre-wrap">{question.answer}</p>
                {question.parts && question.parts.map(p => (
                  <div key={p.part} className="mt-2">
                    <p className="text-blue-300 text-xs font-semibold">({p.part}) Model answer:</p>
                    <p className="text-gray-300 text-sm">{p.answer}</p>
                  </div>
                ))}
              </div>
              {selfMark === null && (
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-400">Self-assess:</span>
                  <button onClick={() => handleSelfMark(true)} className="bg-green-800 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg">✓ Correct</button>
                  <button onClick={() => handleSelfMark(false)} className="bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-1.5 rounded-lg">✗ Incorrect</button>
                </div>
              )}
            </div>
          )}

          {/* Explanation (MCQ) */}
          {answered && question.type === 'mcq' && question.explanation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
              <span className="font-semibold text-blue-300">Explanation: </span>
              <span className="text-gray-300">{question.explanation}</span>
            </div>
          )}

          {/* Result + next */}
          {answered && (
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              {question.type === 'mcq' && (
                <span className={`font-bold text-sm ${selected === question.answer ? 'text-green-400' : 'text-red-400'}`}>
                  {selected === question.answer ? '✓ Correct!' : '✗ Incorrect'}
                </span>
              )}
              {question.type === 'structured' && selfMark !== null && (
                <span className={`font-bold text-sm ${selfMark ? 'text-green-400' : 'text-red-400'}`}>
                  {selfMark ? '✓ Marked correct' : '✗ Marked incorrect'}
                </span>
              )}
              <button onClick={fetchQuestion} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl">Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Progress chart */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Overall Progress by Topic</h3>
        <ProgressChart stats={progress.practiceStats} />
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold text-white">{progress.practiceStats.total}</div><div className="text-xs text-gray-500">Total questions</div></div>
          <div><div className="text-2xl font-bold text-green-400">{progress.practiceStats.correct}</div><div className="text-xs text-gray-500">Correct</div></div>
          <div><div className="text-2xl font-bold text-blue-400">{progress.practiceStats.total > 0 ? Math.round(progress.practiceStats.correct / progress.practiceStats.total * 100) : 0}%</div><div className="text-xs text-gray-500">Accuracy</div></div>
        </div>
      </div>
    </div>
  )
}
