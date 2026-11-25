import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="text-center">
      <h1 className="font-pixel text-3xl text-neon-pink">GAME OVER</h1>
      <p className="mt-4 font-terminal text-2xl text-neon-amber">404 — сторінку не знайдено. INSERT COIN</p>
      <Link to="/" className="mt-6 inline-block font-pixel text-xs text-neon-cyan">
        ← На головну
      </Link>
    </section>
  )
}
