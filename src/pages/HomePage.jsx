import { Link } from 'react-router-dom'
import { GAMES } from '../games/gamesData.js'
import HighScoresTable from '../components/HighScoresTable.jsx'

export default function HomePage() {
  return (
    <div>
      <section>
        <h1 className="font-pixel text-xl leading-relaxed text-neon-pink">Ретро-Аркади XX століття</h1>
        <p className="mt-3 max-w-3xl font-terminal text-2xl text-white/80">
          Цифровий музей відеоігор другої половини XX століття. Обирайте автомат, грайте й дізнавайтеся,
          як усе починалося.
        </p>
      </section>

      {/* Хронологія епохи: від Pong до Snake */}
      <section className="mt-10">
        <h2 className="font-pixel text-sm text-neon-cyan">Хронологія епохи</h2>
        <ol className="mt-4 flex flex-col gap-4 border-l-2 border-neon-cyan/40 pl-4 md:flex-row md:justify-between md:border-l-0 md:border-t-2 md:pl-0 md:pt-4">
          {GAMES.map((g) => (
            <li key={g.slug} className="md:flex-1">
              <Link to={`/games/${g.slug}`} className="group block">
                <span className="font-terminal text-3xl" style={{ color: g.accent }}>
                  {g.year}
                </span>
                <span className="block font-pixel text-[10px] text-white/80 group-hover:text-neon-pink">
                  {g.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Вітрина п'яти ігор */}
      <section className="mt-10">
        <h2 className="font-pixel text-sm text-neon-cyan">Вітрина автоматів</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <li key={g.slug}>
              <Link
                to={`/games/${g.slug}`}
                className="block h-full border-2 p-4 transition-shadow hover:shadow-[0_0_16px_var(--accent)]"
                style={{ borderColor: g.accent, '--accent': g.accent }}
              >
                <span className="font-terminal text-2xl text-neon-amber">{g.year}</span>
                <span className="mt-1 block font-pixel text-sm" style={{ color: g.accent }}>
                  {g.title}
                </span>
                <span className="mt-2 block text-white/70">{g.tagline}</span>
                <span className="mt-2 block text-sm text-white/40">{g.company}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Зведена таблиця чемпіонів */}
      <section className="mt-10">
        <h2 className="font-pixel text-sm text-neon-cyan">Зал слави</h2>
        <div className="mt-4">
          <HighScoresTable />
        </div>
      </section>
    </div>
  )
}
