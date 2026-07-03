import React, { useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { EXPERIMENTS } from '../experiments/experimentData'
import ExperimentShell from '../experiments/ExperimentShell'

export default function PracticeLab() {
  const { t, pick } = useLang()
  const [activeId, setActiveId] = useState(null)
  const active = activeId ? EXPERIMENTS.find(e => e.id === activeId) : null

  if (active) {
    return (
      <div>
        <button onClick={() => setActiveId(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm">
          {t('btn_back_lab')}
        </button>
        <ExperimentShell key={active.id} experiment={active} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t('lab_title')}</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-3xl">{t('lab_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPERIMENTS.map(exp => (
          <button key={exp.id} onClick={() => setActiveId(exp.id)}
            className="card text-left hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl">{exp.icon}</span>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-sm mb-1">{pick(exp.title)}</h3>
            <p className="text-slate-500 text-xs mb-3">{pick(exp.desc)}</p>
            <div className="flex flex-wrap gap-1">
              {exp.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">{pick(tag)}</span>
              ))}
            </div>
            <span className="inline-block mt-3 text-xs font-semibold text-blue-600 group-hover:text-blue-700">{t('lab_open')} →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
