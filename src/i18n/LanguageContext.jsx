import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { STRINGS } from './strings'

const LanguageContext = createContext(null)
const LANG_KEY = 'chem_elec_lang'

export const LANGS = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'zh', label: '中文', name: '繁體中文' },
]

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch { /* ignore */ }
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang) } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'zh' ? 'zh-Hant-HK' : 'en'
    }
  }, [lang])

  const setLang = useCallback((l) => setLangState(l === 'zh' ? 'zh' : 'en'), [])
  const toggle = useCallback(() => setLangState(l => (l === 'en' ? 'zh' : 'en')), [])

  // t: look up a UI-chrome string id, fall back to English then the id itself.
  const t = useCallback((id) => {
    const entry = STRINGS[id]
    if (!entry) return id
    return entry[lang] ?? entry.en ?? id
  }, [lang])

  // pick: resolve a bilingual content node { en, zh } (or plain string) to text.
  const pick = useCallback((node) => {
    if (node == null) return ''
    if (typeof node === 'string') return node
    return node[lang] ?? node.en ?? ''
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, pick }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
