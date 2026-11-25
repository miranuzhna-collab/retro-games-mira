import { useState } from 'react'
import { GAMES } from '../games/gamesData.js'
import { getScore, resetScores } from '../utils/storageService.js'

// Зведене табло чемпіонів: рекорди всіх п'яти ігор з localStorage.
export default function HighScoresTable() {
  // Лічильник змушує таблицю перечитати рекорди після скидання
  const [version, setVersion] = useState(0)

  const handleReset = () => {
    if (window.confirm('Скинути всі рекорди? Це не можна скасувати.')) {
      resetScores(GAMES.map((g) => g.slug))
      setVersion((v) => v + 1)
    }
  }

  return (
    <div key={version} className="max-w-xl border-2 border-neon-amber p-4">
      <table className="w-full font-terminal text-2xl">
        <caption className="sr-only">Таблиця рекордів</caption>
        <thead>
          <tr className="text-left font-pixel text-[10px] text-neon-amber">
            <th className="pb-2">Гра</th>
            <th className="pb-2 text-right">Рекорд</th>
          </tr>
        </thead>
        <tbody>
          {GAMES.map((g) => (
            <tr key={g.slug} className="border-t border-white/10">
              <td className="py-1" style={{ color: g.accent }}>
                {g.title} <span className="text-white/40">{g.year}</span>
              </td>
              <td className="py-1 text-right text-terminal">{String(getScore(g.slug)).padStart(5, '0')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={handleReset}
        className="mt-4 border-2 border-neon-pink px-3 py-1 font-pixel text-[10px] text-neon-pink hover:bg-neon-pink hover:text-night"
      >
        СКИНУТИ РЕКОРДИ
      </button>
    </div>
  )
}
