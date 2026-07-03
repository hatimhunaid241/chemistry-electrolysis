import React from 'react'
import { NavLink } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

const TABS = [
  { to: '/lessons', key: 'nav_lessons', icon: '📚' },
  { to: '/simulations', key: 'nav_simulations', icon: '🧪' },
  { to: '/lab', key: 'nav_lab', icon: '🔬' },
  { to: '/practice', key: 'nav_practice', icon: '✏️' },
  { to: '/settings', key: 'nav_settings', icon: '⚙️' },
]

export default function Navigation() {
  const { t } = useLang()
  return (
    <nav className="flex flex-wrap gap-1">
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `tab-btn ${isActive ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <span className="hidden sm:inline">{tab.icon} </span>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  )
}
