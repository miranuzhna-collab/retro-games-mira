import { useSettings } from '../utils/SettingsContext.jsx'

// Шар сканліній і мерехтіння поверх усього сайту. Кліки пропускає крізь себе.
export default function CrtOverlay() {
  const { crtOn } = useSettings()
  if (!crtOn) return null
  return <div className="crt-overlay" aria-hidden="true" />
}
