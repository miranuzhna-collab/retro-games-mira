// Рушій Snake (1997) на Canvas у стилі зеленого LCD-екрана Nokia.
// Логіка кроку винесена в чисті функції (без Canvas), щоб її можна було тестувати.

const COLS = 20
const ROWS = 15
const CELL = 24 // 20*24 = 480, 15*24 = 360
const W = COLS * CELL
const H = ROWS * CELL

const START_INTERVAL = 0.14 // секунд між кроками на початку
const MIN_INTERVAL = 0.06 // найшвидше
const SPEEDUP = 0.004 // на скільки швидшає кожна з'їдена їжа
const FOOD_POINTS = 10

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

// Протилежні напрямки: розвернутись на 180° (у власне тіло) не можна
export const isOpposite = (a, b) => DIRS[a].x + DIRS[b].x === 0 && DIRS[a].y + DIRS[b].y === 0

// Випадкова вільна клітинка для їжі; null, якщо поле повністю заповнене
export function placeFood(snake, cols, rows, random = Math.random) {
  const taken = new Set(snake.map((c) => `${c.x},${c.y}`))
  const free = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  return free.length ? free[Math.floor(random() * free.length)] : null
}

// Один крок гри. snake — масив клітинок, snake[0] — голова.
// Повертає { snake, food, ate, dead, full }:
//   dead — врізалися в стіну або в себе; full — змійка заповнила все поле (перемога).
export function advance({ snake, food, dir, cols, rows }, random = Math.random) {
  const d = DIRS[dir]
  const head = { x: snake[0].x + d.x, y: snake[0].y + d.y }

  // Стіни
  if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows) {
    return { snake, food, ate: false, dead: true, full: false }
  }

  const ate = food !== null && head.x === food.x && head.y === food.y
  // Якщо їжу не з'їли, хвіст звільняє клітинку цього кроку, тож у неї можна зайти
  const body = ate ? snake : snake.slice(0, -1)
  if (body.some((c) => c.x === head.x && c.y === head.y)) {
    return { snake, food, ate: false, dead: true, full: false }
  }

  const nextSnake = [head, ...body]
  if (!ate) return { snake: nextSnake, food, ate: false, dead: false, full: false }

  const nextFood = placeFood(nextSnake, cols, rows, random)
  return { snake: nextSnake, food: nextFood, ate: true, dead: false, full: nextFood === null }
}

export function createSnakeEngine(canvas, { play, onScore, onStatus, onGameOver }) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Кольори «LCD»: світле тло та темні пікселі
  const BG = '#a8c256'
  const INK = '#1f2d0f'

  let status = 'idle'
  let rafId = null
  let lastTime = null
  let accumulator = 0
  let destroyed = false

  let snake, food, dir, queue, eaten, interval

  const setStatus = (s) => {
    status = s
    onStatus(s)
  }

  const reset = () => {
    const cx = Math.floor(COLS / 2)
    const cy = Math.floor(ROWS / 2)
    snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]
    dir = 'right'
    queue = [] // черга поворотів: кілька швидких натискань між кроками не губляться
    eaten = 0
    interval = START_INTERVAL
    food = placeFood(snake, COLS, ROWS)
    accumulator = 0
    onScore(0)
  }

  const finish = (won) => {
    const score = eaten * FOOD_POINTS
    play(won ? 'win' : 'gameover')
    setStatus('over')
    stopLoop()
    draw()
    onGameOver({ score, won })
  }

  const tick = () => {
    // Беремо наступний поворот із черги, якщо він не розворот на 180°
    while (queue.length) {
      const next = queue.shift()
      if (next !== dir && !isOpposite(next, dir)) {
        dir = next
        break
      }
    }

    const result = advance({ snake, food, dir, cols: COLS, rows: ROWS })
    if (result.dead) return finish(false)

    snake = result.snake
    food = result.food
    if (result.ate) {
      eaten++
      interval = Math.max(MIN_INTERVAL, interval - SPEEDUP) // розгін
      play('eat')
      onScore(eaten * FOOD_POINTS)
      if (result.full) finish(true)
    }
  }

  const draw = () => {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)

    // Їжа: пікселі у формі плюса
    if (food) {
      const fx = food.x * CELL
      const fy = food.y * CELL
      ctx.fillStyle = INK
      ctx.fillRect(fx + 9, fy + 3, 6, 18)
      ctx.fillRect(fx + 3, fy + 9, 18, 6)
    }

    // Змійка: «пікселі» з невеликим проміжком, голова — суцільний блок
    snake.forEach((c, i) => {
      ctx.fillStyle = INK
      ctx.fillRect(c.x * CELL + 2, c.y * CELL + 2, CELL - 4, CELL - 4)
      if (i > 0) {
        ctx.fillStyle = BG
        ctx.fillRect(c.x * CELL + 7, c.y * CELL + 7, CELL - 14, CELL - 14)
      }
    })

    // Рамка поля
    ctx.strokeStyle = INK
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, W - 4, H - 4)
  }

  const loop = (now) => {
    if (destroyed || status !== 'running') return
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.25)
    lastTime = now
    // Рух ідеться кроками фіксованої тривалості, незалежно від частоти кадрів
    accumulator += dt
    while (accumulator >= interval && status === 'running') {
      accumulator -= interval
      tick()
    }
    if (status === 'running') {
      draw()
      rafId = requestAnimationFrame(loop)
    }
  }

  const startLoop = () => {
    lastTime = null
    rafId = requestAnimationFrame(loop)
  }

  const stopLoop = () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  reset()
  draw()

  return {
    keymap: {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    },

    start() {
      if (destroyed) return
      stopLoop()
      reset()
      play('start')
      setStatus('running')
      startLoop()
    },
    pause() {
      if (status !== 'running') return
      stopLoop()
      setStatus('paused')
      draw()
    },
    resume() {
      if (status !== 'paused') return
      setStatus('running')
      startLoop()
    },
    togglePause() {
      if (status === 'running') this.pause()
      else if (status === 'paused') this.resume()
    },
    // Для змійки важливий лише момент натискання: додаємо напрямок у чергу
    setInput(name, pressed) {
      if (pressed && name in DIRS && queue.length < 3) queue.push(name)
    },
    releaseAll() {},
    destroy() {
      destroyed = true
      stopLoop()
    },
  }
}
