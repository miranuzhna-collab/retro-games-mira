import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { findGame } from '../games/gamesData.js'
import { ENGINES } from '../games/engines.js'
import ArcadeCabinet from '../components/ArcadeCabinet.jsx'
import GameArticle from '../components/GameArticle.jsx'
import { getScore, setScoreIfBest } from '../utils/storageService.js'
import { useRetroAudio } from '../utils/useRetroAudio.js'
import NotFoundPage from './NotFoundPage.jsx'

const SWIPE_DISTANCE = 24 // пікселів, після яких рух пальця вважається свайпом

// Одна універсальна сторінка для всіх ігор: slug з URL визначає гру.
export default function GamePage() {
  const { slug } = useParams()
  const game = findGame(slug)

  // Невідомий slug (/games/abc) — показуємо 404
  if (!game) return <NotFoundPage />

  // key: при переході до іншої гри весь стан (рахунок, рушій) створюється заново
  return <GameView key={game.slug} game={game} />
}

function GameView({ game }) {
  const { play } = useRetroAudio()
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const createEngine = ENGINES[game.slug]

  const [status, setStatus] = useState(createEngine ? 'idle' : 'soon')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => getScore(game.slug))
  const [won, setWon] = useState(false)

  // Життєвий цикл рушія: створюємо при вході на сторінку, знищуємо при виході
  useEffect(() => {
    if (!createEngine) return
    const engine = createEngine(canvasRef.current, {
      play,
      onScore: setScore,
      onStatus: setStatus,
      onGameOver: ({ score: finalScore, won: isWin }) => {
        setWon(isWin)
        if (setScoreIfBest(game.slug, finalScore)) setHighScore(finalScore)
      },
    })
    engineRef.current = engine

    // Клавіатура: клавіші перетворюються на дії через keymap рушія
    const onKey = (pressed) => (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const action = engine.keymap[e.key]
      if (!action) return
      e.preventDefault() // щоб стрілки й пробіл не прокручували сторінку
      engine.setInput(action, pressed)
    }
    const onKeyDown = onKey(true)
    const onKeyUp = onKey(false)

    // P — пауза / продовження
    const onPauseKey = (e) => {
      if (e.key !== 'p' && e.key !== 'P') return
      engine.togglePause()
    }

    // Втратили фокус (інша вкладка/вікно) — ставимо на паузу й відпускаємо клавіші
    const onLeave = () => {
      engine.releaseAll()
      engine.pause()
    }
    const onVisibility = () => document.hidden && onLeave()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('keydown', onPauseKey)
    window.addEventListener('blur', onLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onPauseKey)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      engine.destroy() // зупиняє requestAnimationFrame
      engineRef.current = null
    }
  }, [createEngine, game.slug, play])

  // Свайп по полю (Snake, Pac-Man): сенсорне керування без екранних кнопок.
  // Напрямок визначається, щойно палець зсунувся достатньо далеко; далі відлік іде від нової точки.
  useEffect(() => {
    const el = canvasRef.current
    if (!game.swipe || !createEngine || !el) return
    let start = null
    const onDown = (e) => {
      if (e.pointerType === 'mouse') return
      start = { x: e.clientX, y: e.clientY }
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return
      const name = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      engineRef.current?.setInput(name, true)
      start = { x: e.clientX, y: e.clientY }
    }
    const onEnd = () => {
      start = null
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onEnd)
    el.addEventListener('pointercancel', onEnd)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onEnd)
      el.removeEventListener('pointercancel', onEnd)
    }
  }, [createEngine, game.swipe])

  return (
    <section>
      <h1 className="font-pixel text-xl" style={{ color: game.accent }}>
        {game.title} ({game.year})
      </h1>
      <p className="mt-2 text-white/60">{game.tagline}</p>

      <div className="mt-6">
        <ArcadeCabinet
          title={game.title}
          score={score}
          highScore={highScore}
          status={status}
          overlayTitle={status === 'over' && won ? 'ПЕРЕМОГА!' : undefined}
          controls={game.pad}
          onStart={() => {
            setWon(false)
            engineRef.current?.start()
          }}
          onResume={() => engineRef.current?.resume()}
          onPause={() => engineRef.current?.pause()}
          onInput={(name, pressed) => engineRef.current?.setInput(name, pressed)}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            role="img"
            aria-label={`Ігрове поле: ${game.title}`}
            className={`block aspect-[4/3] w-full ${game.swipe ? 'swipe-surface' : ''}`}
          />
        </ArcadeCabinet>
        <p className="mt-3 text-center font-terminal text-xl text-terminal">
          {game.controls} <span className="text-white/50">P — пауза.</span>
          {game.swipe && <span className="block text-white/50">На телефоні: свайп по екрану.</span>}
        </p>
      </div>

      <GameArticle game={game} />
    </section>
  )
}
