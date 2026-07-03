import React, { useState, useCallback, useMemo } from 'react'
import { useLang } from '../i18n/LanguageContext'
import LiveChart from './LiveChart'
import AdaptiveQuestions from './AdaptiveQuestions'

function Section({ n, title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{n}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function ExperimentShell({ experiment }) {
  const { t, pick } = useLang()
  const [samples, setSamples] = useState([])

  const onSample = useCallback((s) => {
    if (!s) return
    if (s.reset) { setSamples([]); return }
    setSamples(prev => {
      // replace if same time key (electroplating fires per-second effect), else append
      const last = prev[prev.length - 1]
      if (last && last.t === s.t) return [...prev.slice(0, -1), s]
      return [...prev, s].slice(-120)
    })
  }, [])

  const latest = samples.length ? samples[samples.length - 1] : null
  const sim = useMemo(() => experiment.render(onSample), [experiment, onSample])
  const report = experiment.report ? experiment.report(latest) : null

  // Readings table: show up to the last 8 samples (downsampled).
  const rows = useMemo(() => {
    if (!experiment.series || samples.length === 0) return []
    const step = Math.max(1, Math.ceil(samples.length / 8))
    return samples.filter((_, i) => i % step === 0 || i === samples.length - 1)
  }, [samples, experiment.series])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{experiment.icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{pick(experiment.title)}</h2>
          <p className="text-slate-500 text-sm">{pick(experiment.desc)}</p>
        </div>
      </div>

      {/* a. Objective */}
      <Section n="1" title={t('lab_sec_objective')}>
        <p className="text-slate-700 text-sm leading-relaxed">{pick(experiment.objective)}</p>
      </Section>

      {/* b. Setup & Method */}
      <Section n="2" title={t('lab_sec_method')}>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('lab_variables')}</p>
        <ul className="list-disc list-inside text-sm text-slate-700 mb-3 space-y-0.5">
          {experiment.variables.map((v, i) => <li key={i}>{pick(v)}</li>)}
        </ul>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('lab_steps')}</p>
        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-0.5">
          {experiment.steps.map((s, i) => <li key={i}>{pick(s)}</li>)}
        </ol>
      </Section>

      {/* c. Interactive simulation */}
      <Section n="3" title={t('lab_sec_sim')}>
        {sim}
      </Section>

      {/* d. Data & graph */}
      {experiment.series && (
        <Section n="4" title={t('lab_sec_data')}>
          <LiveChart data={samples} series={experiment.series} xKey="t" xLabel={experiment.xLabel} />
          {rows.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-3 py-1.5 text-left text-blue-700">{t('lab_col_time')}</th>
                    {experiment.series.map(s => <th key={s.key} className="border border-slate-200 px-3 py-1.5 text-left text-blue-700">{pick(s.label)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-1.5 text-slate-700">{r.t}</td>
                      {experiment.series.map(s => <td key={s.key} className="border border-slate-200 px-3 py-1.5 text-slate-700">{r[s.key] ?? '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-3">{t('lab_no_data')}</p>
          )}
        </Section>
      )}

      {/* e. Report */}
      {experiment.report && (
        <Section n={experiment.series ? '5' : '4'} title={t('lab_sec_report')}>
          {report
            ? <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 border border-indigo-200 rounded-lg p-3">{pick(report)}</p>
            : <p className="text-xs text-slate-400">{t('lab_no_data')}</p>}
        </Section>
      )}

      {/* f. Comprehension check */}
      <Section n={sectionNum(experiment)} title={t('lab_sec_check')}>
        <AdaptiveQuestions topicKey={`exp_${experiment.id}`} generators={experiment.questions} />
      </Section>
    </div>
  )
}

function sectionNum(exp) {
  let n = 4
  if (exp.series) n++
  if (exp.report) n++
  return String(n)
}
