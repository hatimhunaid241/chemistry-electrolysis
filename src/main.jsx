import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { AppProvider } from './context/AppContext'
import './index.css'

// HashRouter keeps all routing in the URL fragment (#/...), so the built app
// works from any nested sub-directory and even when opened via file://.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>
)
