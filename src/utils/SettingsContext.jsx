import { createContext, useContext, useEffect, useState } from 'react'
import { loadSettings, saveSettings } from './storageService.js'
import { setSoundEnabled } from './audioService.js'

// Глобальні налаштування (звук, CRT) доступні на всіх маршрутах
const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  // Запам'ятовуємо зміни між візитами
  useEffect(() => {
    saveSettings(settings)
    setSoundEnabled(settings.soundOn) // аудіосервіс знає про тумблер усюди
  }, [settings])

  const toggleSound = () => setSettings((s) => ({ ...s, soundOn: !s.soundOn }))
  const toggleCrt = () => setSettings((s) => ({ ...s, crtOn: !s.crtOn }))

  return (
    <SettingsContext.Provider value={{ ...settings, toggleSound, toggleCrt }}>
      {children}
    </SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext)
