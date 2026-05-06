import React from 'react'

const TABS = [
  { id: 'lessons', label: 'Lessons', icon: '📚' },
  { id: 'simulations', label: 'Simulations', icon: '🧪' },
  { id: 'practice', label: 'Practice', icon: '✏️' },
  { id: 'settings', label: 'AI Settings', icon: '⚙️' },
]

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <nav className="flex gap-1">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <span className="hidden sm:inline">{tab.icon} </span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
