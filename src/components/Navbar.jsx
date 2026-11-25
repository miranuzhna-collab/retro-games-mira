import { Link, NavLink } from 'react-router-dom'
import { GAMES } from '../games/gamesData.js'
import { playSound } from '../utils/audioService.js'
import { useSettings } from '../utils/SettingsContext.jsx'

// Підсвічує активний маршрут неоновим кольором
const linkClass = ({ isActive }) =>
  `px-2 py-1 font-pixel text-[10px] ${
    isActive ? 'text-neon-cyan' : 'text-white/70 hover:text-neon-pink'
  }`

export default function Navbar() {
  const { soundOn, crtOn, toggleSound, toggleCrt } = useSettings()
  return (
    <header className="border-b border-neon-pink/40 bg-night-2">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 p-3">
        <Link to="/" className="font-pixel text-xs text-neon-amber">
          Ретро-Аркади XX століття
        </Link>
        <div className="flex flex-wrap gap-1">
          {GAMES.map((g) => (
            <NavLink key={g.slug} to={`/games/${g.slug}`} className={linkClass}>
              {g.title}
            </NavLink>
          ))}
          <NavLink to="/about" className={linkClass}>
            Про проєкт
          </NavLink>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => {
              // Вмикаючи звук, одразу граємо сигнал-підтвердження (це ж і «розбудить» аудіо в браузері)
              if (!soundOn) playSound('select', { force: true })
              toggleSound()
            }}
            aria-pressed={soundOn}
            title="Звук"
            className="border border-neon-cyan/50 px-2 py-1 hover:border-neon-pink"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button
            onClick={toggleCrt}
            aria-pressed={crtOn}
            title="CRT-фільтр"
            className="border border-neon-cyan/50 px-2 py-1 font-pixel text-[10px] hover:border-neon-pink"
          >
            📺 CRT: {crtOn ? 'УВІМК' : 'ВИМК'}
          </button>
        </div>
      </nav>
    </header>
  )
}
