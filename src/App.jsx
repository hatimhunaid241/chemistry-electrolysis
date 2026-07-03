import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import LanguageToggle from './components/LanguageToggle'
import { useLang } from './i18n/LanguageContext'
import LessonsTab from './tabs/LessonsTab'
import SimulationsTab from './tabs/SimulationsTab'
import PracticeLab from './tabs/PracticeLab'
import PracticeTab from './tabs/PracticeTab'
import SettingsTab from './tabs/SettingsTab'

export default function App() {
  const { t } = useLang()
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg font-bold text-white">⚡</div>
            <div className="hidden md:block">
              <h1 className="font-bold text-slate-900 leading-tight text-sm sm:text-base">{t('app_title')}</h1>
              <p className="text-xs text-slate-500">{t('app_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Navigation />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/lessons" replace />} />
          <Route path="/lessons" element={<LessonsTab />} />
          <Route path="/simulations" element={<SimulationsTab />} />
          <Route path="/lab" element={<PracticeLab />} />
          <Route path="/practice" element={<PracticeTab />} />
          <Route path="/settings" element={<SettingsTab />} />
          <Route path="*" element={<Navigate to="/lessons" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-slate-400 text-center">
          {t('app_title')} · {t('app_subtitle')}
        </div>
      </footer>
    </div>
  )
}
