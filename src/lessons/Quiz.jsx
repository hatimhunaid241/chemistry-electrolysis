import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

function MCQQuestion({ q, index, onAnswer, answered }) {
  const [selected, setSelected] = useState(null)
  const [showHints, setShowHints] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)

  const handleSelect = (opt) => {
    if (answered) return
    setSelected(opt)
    onAnswer(opt === q.answer)
  }

  const optColors = (opt) => {
    if (!answered || selected !== opt) {
      return opt === selected && !answered
        ? 'border-blue-500 bg-blue-950/40'
        : 'border-gray-700 hover:border-gray-500 cursor-pointer'
    }
    if (opt === q.answer) return 'border-green-500 bg-green-950/40'
    if (opt === selected) return 'border-red-500 bg-red-950/40'
    return 'border-gray-700 opacity-50'
  }

  return (
    <div className="mb-2">
      <p className="text-gray-200 font-medium mb-3">
        <span className="text-blue-400 font-bold">Q{index + 1}.</span> {q.question}
      </p>
      <div className="space-y-2 mb-3">
        {Object.entries(q.options).map(([opt, text]) => (
          <div
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`flex items-start gap-3 border rounded-lg p-3 transition-all ${optColors(opt)} ${!answered ? 'cursor-pointer' : ''}`}
          >
            <span className={`font-bold shrink-0 ${opt === q.answer && answered ? 'text-green-400' : 'text-gray-400'}`}>{opt}.</span>
            <span className="text-sm text-gray-300">{text}</span>
          </div>
        ))}
      </div>
      {q.hints && q.hints.length > 0 && !answered && (
        <div className="mt-2">
          {!showHints ? (
            <button onClick={() => setShowHints(true)} className="text-xs text-yellow-500 hover:text-yellow-400">💡 Show hint</button>
          ) : (
            <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-3 text-yellow-200 text-sm">
              <p className="font-semibold mb-1">Hint {hintIdx + 1}/{q.hints.length}:</p>
              <p>{q.hints[hintIdx]}</p>
              {hintIdx < q.hints.length - 1 && (
                <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-yellow-400 hover:text-yellow-300">Next hint →</button>
              )}
            </div>
          )}
        </div>
      )}
      {answered && (
        <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 border border-gray-700">
          <span className="font-semibold text-blue-300">Explanation: </span>{q.explanation}
        </div>
      )}
    </div>
  )
}

function StructuredQuestion({ q, index, onAnswer, answered }) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [selfMark, setSelfMark] = useState(null)

  const submit = () => {
    if (!userAnswer.trim()) return
    setSubmitted(true)
  }

  const handleSelfMark = (correct) => {
    setSelfMark(correct)
    onAnswer(correct)
  }

  return (
    <div className="mb-2">
      <p className="text-gray-200 font-medium mb-3">
        <span className="text-blue-400 font-bold">Q{index + 1}.</span> {q.question}
      </p>
      {!submitted ? (
        <>
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none resize-none"
          />
          {q.hints && q.hints.length > 0 && (
            <div className="mt-2">
              {!showHints ? (
                <button onClick={() => setShowHints(true)} className="text-xs text-yellow-500 hover:text-yellow-400">💡 Show hint</button>
              ) : (
                <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-3 text-yellow-200 text-sm mb-2">
                  <p className="font-semibold mb-1">Hint {hintIdx + 1}/{q.hints.length}:</p>
                  <p>{q.hints[hintIdx]}</p>
                  {hintIdx < q.hints.length - 1 && (
                    <button onClick={() => setHintIdx(i => i + 1)} className="text-xs mt-2 text-yellow-400 hover:text-yellow-300">Next hint →</button>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={submit}
            disabled={!userAnswer.trim()}
            className="mt-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg"
          >
            Check Answer
          </button>
        </>
      ) : (
        <div>
          <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm">
            <p className="text-gray-500 text-xs mb-1">Your answer:</p>
            <p className="text-gray-300 whitespace-pre-wrap">{userAnswer}</p>
          </div>
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 text-sm mb-3">
            <p className="text-green-300 font-semibold mb-1">Model Answer / Mark Scheme:</p>
            <p className="text-gray-300 whitespace-pre-wrap">{q.answer}</p>
          </div>
          {selfMark === null && (
            <div className="flex gap-3">
              <p className="text-sm text-gray-400 mr-2">Self-assess:</p>
              <button onClick={() => handleSelfMark(true)} className="text-sm bg-green-800 hover:bg-green-700 text-white px-4 py-1 rounded-lg">✓ Correct</button>
              <button onClick={() => handleSelfMark(false)} className="text-sm bg-red-900 hover:bg-red-800 text-white px-4 py-1 rounded-lg">✗ Incorrect</button>
            </div>
          )}
          {selfMark !== null && (
            <p className={`text-sm font-semibold ${selfMark ? 'text-green-400' : 'text-red-400'}`}>
              {selfMark ? '✓ Marked as correct' : '✗ Marked as incorrect'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Quiz({ questions, lessonId, onComplete, onBack }) {
  const { markLessonComplete } = useApp()
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const handleAnswer = (qId, correct) => {
    setAnswers(prev => ({ ...prev, [qId]: correct }))
  }

  const allAnswered = questions.every(q => q.id in answers)
  const score = Math.round((Object.values(answers).filter(Boolean).length / questions.length) * 100)

  const finish = () => {
    markLessonComplete(lessonId, score)
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-4">{score >= 80 ? '🏆' : score >= 60 ? '👍' : '📖'}</div>
        <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
        <p className="text-gray-400 mb-4">You scored <span className={`font-bold text-2xl ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</span></p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-xl">← Back to Lesson</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Lesson Quiz</h3>
        <span className="text-sm text-gray-500">{Object.keys(answers).length}/{questions.length} answered</span>
      </div>
      <div className="space-y-6 divide-y divide-gray-800">
        {questions.map((q, i) => (
          <div key={q.id} className="pt-5 first:pt-0">
            {q.type === 'mcq' ? (
              <MCQQuestion q={q} index={i} onAnswer={(c) => handleAnswer(q.id, c)} answered={q.id in answers} />
            ) : (
              <StructuredQuestion q={q} index={i} onAnswer={(c) => handleAnswer(q.id, c)} answered={q.id in answers} />
            )}
          </div>
        ))}
      </div>
      {allAnswered && (
        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button onClick={finish} className="bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl">
            Finish & Save Score
          </button>
        </div>
      )}
    </div>
  )
}
