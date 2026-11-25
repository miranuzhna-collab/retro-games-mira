import { Link } from 'react-router-dom'
import { getNeighbors } from '../games/gamesData.js'

// Історико-технічний лекторій під автоматом (ТЗ, розділ 4.2): текст статті,
// цікаві факти та кнопки переходу до сусідніх ігор.
export default function GameArticle({ game }) {
  const { article } = game
  const { prev, next } = getNeighbors(game.slug)

  return (
    <article className="mx-auto mt-10 max-w-3xl">
      <p className="font-terminal text-2xl leading-snug text-white/90">{article.intro}</p>

      <p className="mt-3 text-sm text-white/50">
        {game.company} · автор: {game.author} · {game.year}
      </p>

      {article.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="font-pixel text-sm" style={{ color: game.accent }}>
            {section.title}
          </h2>
          {section.text.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-lg leading-relaxed text-white/80">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-8 border-2 p-4" style={{ borderColor: game.accent }}>
        <h2 className="font-pixel text-sm text-neon-amber">Цікаві факти</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-lg text-white/80">
          {article.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      {/* Навігація між іграми; на краях колекції порожнє місце лишається */}
      <nav className="mt-10 flex justify-between gap-4 font-pixel text-[10px]">
        {prev ? (
          <Link to={`/games/${prev.slug}`} className="text-neon-cyan hover:text-neon-pink">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/games/${next.slug}`} className="text-neon-cyan hover:text-neon-pink">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
