import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useLang } from '../i18n/LanguageContext'
import { EXPERIMENTS } from '../experiments/experimentData'

const noop = () => {}

export default function SimulationsTab() {
  const { markSimViewed, progress } = useApp()
  const { t, pick } = useLang()
  const [activeId, setActiveId] = useState(null)

  const active = activeId ? EXPERIMENTS.find(e => e.id === activeId) : null
  const open = (exp) => { setActiveId(exp.id); markSimViewed(exp.id) }

  if (active) {
    return (
      <div>
        <button onClick={() => setActiveId(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm">
          {t('btn_back_sims')}
        </button>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">{active.icon} {pick(active.title)}</h2>
          <p className="text-slate-500 text-sm mt-1">{pick(active.desc)}</p>
        </div>
        <div className="info-box text-xs mb-4">{t('sims_hint')}</div>
        {active.render(noop)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t('sims_title')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('sims_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {EXPERIMENTS.map(exp => {
          const viewed = progress.simsViewed.includes(exp.id)
          return (
            <button key={exp.id} onClick={() => open(exp)} className={`card text-left hover:border-blue-400 hover:shadow-md transition-all group ${viewed ? 'border-green-300' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{exp.icon}</span>
                {viewed && <span className="text-green-700 text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{t('sims_visited')}</span>}
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-sm mb-2">{pick(exp.title)}</h3>
              <p className="text-slate-500 text-xs mb-3">{pick(exp.desc)}</p>
              <div className="flex flex-wrap gap-1">
                {exp.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">{pick(tag)}</span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
