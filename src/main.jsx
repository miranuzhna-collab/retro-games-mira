import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import { SettingsProvider } from './utils/SettingsContext.jsx'
import App from './App.jsx'

// HashRouter: адреси виду /#/games/pong — працює на будь-якому хостингу
// без налаштування сервера (див. ТЗ, розділ 2).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </HashRouter>
  </StrictMode>,
)
