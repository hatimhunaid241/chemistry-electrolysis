import React from 'react'
import { useLang, LANGS } from '../i18n/LanguageContext'

export default function LanguageToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-0.5 text-sm" role="group" aria-label="Language">
      {LANGS.map(l => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${lang === l.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
