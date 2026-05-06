import React, { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Navigation from './components/Navigation'
import LessonsTab from './tabs/LessonsTab'
import SimulationsTab from './tabs/SimulationsTab'
import PracticeTab from './tabs/PracticeTab'
import SettingsTab from './tabs/SettingsTab'

export default function App() {
  const [activeTab, setActiveTab] = useState('lessons')

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">⚡</div>
              <div>
                <h1 className="font-bold text-white leading-tight text-sm sm:text-base">Electrolysis & Voltaic Cells</h1>
                <p className="text-xs text-gray-500">HKDSE Chemistry Study Pack</p>
              </div>
            </div>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {activeTab === 'lessons' && <LessonsTab />}
          {activeTab === 'simulations' && <SimulationsTab />}
          {activeTab === 'practice' && <PracticeTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </AppProvider>
  )
}
