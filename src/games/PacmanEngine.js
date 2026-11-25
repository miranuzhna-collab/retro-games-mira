// Рушій Pac-Man (1980) на Canvas: тайловий лабіринт, 4 привиди з різним ШІ.
// Лабіринт, пошук шляху та цілі привидів — чисті функції (без Canvas) для тестування.
//
// Координати істот — дробові «тайлові»: центр клітинки (i, j) має координати (i, j),
// тож істота стоїть рівно в клітинці, коли обидві координати цілі.

const W = 480
const H = 360
export const COLS = 21
export const ROWS = 15
const TILE = 22
const OX = Math.round((W - COLS * TILE) / 2) // відступ лабіринту зліва
const OY = 8 // і зверху
export const TUNNEL_ROW = 7

// Ліва половина лабіринту (стовпці 0–10); права — дзеркальна копія.
// # стіна · . крапка · o енерджайзер · пробіл порожньо · - двері будиночка привидів
const LEFT_HALF = [
  '###########',
  '#o....#....',
  '#.##.##.##.',
  '#..........',
  '#.##.#.####',
  '#....#.....',
  '####.#.###-',
  ' ....#.#   ',
  '####.#.####',
  '#....#.....',
  '#.##.#.####',
  '#....#.....',
  '#.##.##.##.',
  '#o.........',
  '###########',
]

export const MAZE = LEFT_HALF.map((half) => half + [...half.slice(0, COLS - 11)].reverse().join(''))

export const PAC_START = { x: 10, y: 11 }
export const HOUSE = { x: 10, y: 7 } // куди повертаються «очі» з'їдених привидів
export const DOOR_OUT = { x: 10, y: 5 } // клітинка просто над дверима

const DIRS = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
}
const DIR_ORDER = ['up', 'left', 'down', 'right'] // порядок при однаковій відстані (як в оригіналі)
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

// ---------- Чиста логіка ----------

// Символ клітинки; за межами лабіринту: тунель у рядку TUNNEL_ROW — вільно, інакше стіна
export function tileAt(maze, x, y) {
  if (y === TUNNEL_ROW && (x < 0 || x >= COLS)) return ' '
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return '#'
  return maze[y][x]
}

// Чи можна зайти в клітинку. Двері пропускають лише привидів, що виходять/повертаються.
export const canEnterTile = (maze, x, y, door = false) => {
  const t = tileAt(maze, x, y)
  return t === '-' ? door : t !== '#'
}

const wrapX = (x) => (x < 0 ? x + COLS : x >= COLS ? x - COLS : x)

// Відстані (у кроках) від клітинки цілі до всіх інших; недосяжні клітинки — Infinity.
// Враховує тунель (вихід за лівий край веде на правий).
export function bfsDistances(maze, tx, ty, door = true) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity))
  dist[ty][tx] = 0
  const queue = [[tx, ty]]
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i]
    for (const d of Object.values(DIRS)) {
      const nx = x + d.x
      const ny = y + d.y
      if (!canEnterTile(maze, nx, ny, door)) continue
      const wx = wrapX(nx)
      if (dist[ny][wx] !== Infinity) continue
      dist[ny][wx] = dist[y][x] + 1
      queue.push([wx, ny])
    }
  }
  return dist
}

// Куди дивиться Pac-Man, і на скільки клітинок уперед цілиться привид
const ahead = (pac, n) => ({ x: pac.x + DIRS[pac.facing].x * n, y: pac.y + DIRS[pac.facing].y * n })

// Цілі привидів у режимі переслідування — у кожного свій «характер»:
//   Blinky — женеться прямо за Pac-Man
//   Pinky  — цілиться на 4 клітинки перед ним (перехоплює)
//   Inky   — використовує позицію Blinky: ціль симетрична відносно точки перед Pac-Man
//   Clyde  — переслідує, але біля Pac-Man лякається й тікає в свій кут
export function chaseTarget(name, ghost, pac, blinky, corner) {
  switch (name) {
    case 'blinky':
      return { x: pac.x, y: pac.y }
    case 'pinky':
      return ahead(pac, 4)
    case 'inky': {
      const p = ahead(pac, 2)
      return { x: p.x * 2 - blinky.x, y: p.y * 2 - blinky.y }
    }
    default: {
      const far = Math.hypot(ghost.x - pac.x, ghost.y - pac.y) > 8
      return far ? { x: pac.x, y: pac.y } : corner
    }
  }
}

// ---------- Рушій ----------

const GHOST_DEFS = [
  { name: 'blinky', color: '#ff2a85', corner: { x: 19, y: 0 }, start: { x: 10, y: 5 }, outside: true, release: 0 },
  { name: 'pinky', color: '#ff9ad5', corner: { x: 2, y: 0 }, start: { x: 10, y: 7 }, release: 1.5 },
  { name: 'inky', color: '#00f3ff', corner: { x: 19, y: 14 }, start: { x: 9, y: 7 }, release: 4 },
  { name: 'clyde', color: '#ff9a1f', corner: { x: 1, y: 14 }, start: { x: 11, y: 7 }, release: 7 },
]

// Чергування режимів: розсіювання (кути) / переслідування, секунд
const MODE_SCHEDULE = [7, 20, 7, 20, 5, Infinity]

const PAC_SPEED = 6 // клітинок за секунду
const GHOST_SPEED = 5.2
const FRIGHT_SPEED = 3.2
const EYES_SPEED = 11
const DOT_POINTS = 10
const ENERGIZER_POINTS = 50
const START_LIVES = 3
const READY_TIME = 1.6

export function createPacmanEngine(canvas, { play, onScore, onStatus, onGameOver }) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  let status = 'idle'
  let rafId = null
  let lastTime = null
  let destroyed = false

  let dots, dotsLeft, pac, ghosts, score, lives, level
  let time, modeIndex, modeTimer, scatter, frightTimer, ghostsEaten
  let readyTimer, deathTimer, clearTimer, clock, wakaToggle
  const distCache = new Map()

  const setStatus = (s) => {
    status = s
    onStatus(s)
  }

  const addScore = (points) => {
    score += points
    onScore(score)
  }

  const speedFactor = () => Math.min(1.4, 1 + 0.05 * (level - 1))

  // Крапки та енерджайзери: копія лабіринту, яку з'їдають по ходу гри
  const buildDots = () => {
    dots = MAZE.map((row) => [...row])
    dotsLeft = 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (dots[y][x] === '.' || dots[y][x] === 'o') dotsLeft++
      }
    }
    // На старті гравця й Blinky крапок немає
    for (const p of [PAC_START, DOOR_OUT]) {
      if (dots[p.y][p.x] === '.') {
        dots[p.y][p.x] = ' '
        dotsLeft--
      }
    }
  }

  // Розставляє героя й привидів по стартових місцях (після смерті й на новому рівні)
  const resetPositions = () => {
    pac = { x: PAC_START.x, y: PAC_START.y, dir: null, facing: 'left', next: 'left', mouth: 0 }
    ghosts = GHOST_DEFS.map((def) => ({
      ...def,
      x: def.start.x,
      y: def.start.y,
      dir: def.outside ? 'left' : def.start.x === 10 ? 'up' : null,
      state: def.outside ? 'active' : 'waiting',
      frightened: false,
      releaseAt: def.release / Math.min(2, speedFactor()),
    }))
    time = 0
    modeIndex = 0
    modeTimer = MODE_SCHEDULE[0]
    scatter = true
    frightTimer = 0
    ghostsEaten = 0
    readyTimer = READY_TIME
    deathTimer = 0
  }

  const reset = () => {
    score = 0
    lives = START_LIVES
    level = 1
    clearTimer = 0
    clock = 0
    wakaToggle = 0
    buildDots()
    resetPositions()
    onScore(0)
  }

  const finish = () => {
    play('gameover')
    setStatus('over')
    stopLoop()
    draw()
    onGameOver({ score, won: false })
  }

  // ----- Рух -----

  const distanceMap = (target) => {
    const key = `${target.x},${target.y}`
    if (!distCache.has(key)) distCache.set(key, bfsDistances(MAZE, target.x, target.y))
    return distCache.get(key)
  }

  const ghostCanEnter = (g, x, y) =>
    canEnterTile(MAZE, x, y, g.state === 'leaving' || g.state === 'eyes' || g.state === 'waiting')

  // Універсальний рух істоти на dist клітинок. У кожному центрі клітинки викликається
  // choose (вибір напрямку), а canEnter перевіряє, чи можна рухатись далі.
  const moveEntity = (e, dist, choose, canEnter) => {
    for (let guard = 0; dist > 1e-9 && guard < 12; guard++) {
      const cx = Math.round(e.x)
      const cy = Math.round(e.y)
      const atCenter = Math.abs(e.x - cx) < 1e-6 && Math.abs(e.y - cy) < 1e-6
      if (atCenter) {
        e.x = cx
        e.y = cy
        choose(e, cx, cy)
        if (!e.dir) return
        const d = DIRS[e.dir]
        if (!canEnter(e, cx + d.x, cy + d.y)) {
          e.dir = null
          return
        }
      }
      if (!e.dir) return
      const d = DIRS[e.dir]
      let toCenter = 1
      if (!atCenter) {
        if (d.x > 0) toCenter = Math.ceil(e.x - 1e-6) - e.x
        else if (d.x < 0) toCenter = e.x - Math.floor(e.x + 1e-6)
        else if (d.y > 0) toCenter = Math.ceil(e.y - 1e-6) - e.y
        else toCenter = e.y - Math.floor(e.y + 1e-6)
      }
      const step = Math.min(dist, toCenter)
      e.x += d.x * step
      e.y += d.y * step
      dist -= step
      // Тунель: вийшли за край — з'являємось з протилежного боку
      if (e.x < -0.5) e.x += COLS
      else if (e.x > COLS - 0.5) e.x -= COLS
    }
  }

  const pacChoose = (e, cx, cy) => {
    // Повертаємо, щойно можна (бажаний напрямок пам'ятається до першого повороту)
    if (e.next && canEnterTile(MAZE, cx + DIRS[e.next].x, cy + DIRS[e.next].y)) {
      e.dir = e.next
      e.facing = e.next
      e.next = null
    }
  }

  const ghostChoose = (g, cx, cy) => {
    if (g.state === 'waiting') {
      g.dir = null
      return
    }
    // Стани, що змінюються при досягненні певних клітинок
    if (g.state === 'eyes' && cx === HOUSE.x && cy === HOUSE.y) {
      g.state = 'leaving'
      g.frightened = false
    }
    if (g.state === 'leaving' && cx === DOOR_OUT.x && cy === DOOR_OUT.y) {
      g.state = 'active'
      g.dir = 'left'
    }

    const options = DIR_ORDER.filter((d) => ghostCanEnter(g, cx + DIRS[d].x, cy + DIRS[d].y))
    if (!options.length) {
      g.dir = null
      return
    }

    // «Очі» та привиди, що виходять з будиночка, йдуть найкоротшим шляхом
    if (g.state === 'eyes' || g.state === 'leaving') {
      const map = distanceMap(g.state === 'eyes' ? HOUSE : DOOR_OUT)
      const distVia = (d) => map[cy + DIRS[d].y][wrapX(cx + DIRS[d].x)]
      let best = options[0]
      for (const d of options) if (distVia(d) < distVia(best)) best = d
      g.dir = best
      return
    }

    // Звичайний рух: без розвороту (окрім глухого кута)
    let choices = options.filter((d) => !(g.dir && d === OPPOSITE[g.dir]))
    if (!choices.length) choices = options

    if (g.frightened) {
      g.dir = choices[Math.floor(Math.random() * choices.length)]
      return
    }

    const target = scatter ? g.corner : chaseTarget(g.name, g, pac, ghosts[0], g.corner)
    let best = choices[0]
    let bestDist = Infinity
    for (const d of choices) {
      const dx = cx + DIRS[d].x - target.x
      const dy = cy + DIRS[d].y - target.y
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    g.dir = best
  }

  const ghostSpeed = (g) => {
    if (g.state === 'eyes') return EYES_SPEED
    if (g.frightened) return FRIGHT_SPEED
    return GHOST_SPEED * speedFactor()
  }

  // ----- Події -----

  const eatAt = () => {
    const tx = Math.round(pac.x)
    const ty = Math.round(pac.y)
    if (tx < 0 || tx >= COLS) return
    const cell = dots[ty][tx]
    if (cell !== '.' && cell !== 'o') return
    dots[ty][tx] = ' '
    dotsLeft--
    if (cell === 'o') {
      addScore(ENERGIZER_POINTS)
      play('score')
      frightTimer = Math.max(2.5, 6.5 - (level - 1) * 0.6)
      ghostsEaten = 0
      for (const g of ghosts) {
        if (g.state === 'eyes') continue
        g.frightened = true
        // привиди в лабіринті розвертаються, як в оригіналі
        if (g.state === 'active' && g.dir) g.dir = OPPOSITE[g.dir]
      }
    } else {
      addScore(DOT_POINTS)
      play(wakaToggle++ % 2 ? 'waka1' : 'waka0')
    }
    if (dotsLeft === 0) {
      clearTimer = 1.4
      play('win')
    }
  }

  const checkCollisions = () => {
    for (const g of ghosts) {
      if (g.state === 'waiting' || g.state === 'eyes') continue
      if (Math.hypot(g.x - pac.x, g.y - pac.y) > 0.65) continue
      if (g.frightened) {
        // З'їли привида: 200, 400, 800, 1600 очок по ланцюжку
        g.frightened = false
        g.state = 'eyes'
        addScore(200 * 2 ** ghostsEaten)
        ghostsEaten = Math.min(ghostsEaten + 1, 3)
        play('line')
      } else {
        lives--
        deathTimer = 1.4
        play('death')
        return
      }
    }
  }

  const update = (dt) => {
    clock += dt
    if (readyTimer > 0) {
      readyTimer -= dt
      return
    }
    if (deathTimer > 0) {
      deathTimer -= dt
      if (deathTimer <= 0) {
        if (lives <= 0) return finish()
        resetPositions()
      }
      return
    }
    if (clearTimer > 0) {
      clearTimer -= dt
      if (clearTimer <= 0) {
        level++
        buildDots()
        resetPositions()
      }
      return
    }

    time += dt

    // Режими розсіювання/переслідування (поки привиди не налякані)
    if (frightTimer > 0) {
      frightTimer -= dt
      if (frightTimer <= 0) ghosts.forEach((g) => (g.frightened = false))
    } else {
      modeTimer -= dt
      if (modeTimer <= 0) {
        modeIndex++
        modeTimer = MODE_SCHEDULE[Math.min(modeIndex, MODE_SCHEDULE.length - 1)]
        scatter = !scatter
        for (const g of ghosts) if (g.state === 'active' && g.dir) g.dir = OPPOSITE[g.dir]
      }
    }

    // Pac-Man
    const before = { x: pac.x, y: pac.y }
    moveEntity(pac, PAC_SPEED * speedFactor() * dt, pacChoose, (e, x, y) => canEnterTile(MAZE, x, y))
    if (pac.x !== before.x || pac.y !== before.y) pac.mouth += dt * 14
    eatAt()

    // Привиди
    for (const g of ghosts) {
      if (g.state === 'waiting' && time >= g.releaseAt) g.state = 'leaving'
      moveEntity(g, ghostSpeed(g) * dt, ghostChoose, ghostCanEnter)
    }

    checkCollisions()
  }

  // ----- Малювання -----

  const px = (x) => OX + (x + 0.5) * TILE
  const py = (y) => OY + (y + 0.5) * TILE

  const drawMaze = () => {
    ctx.fillStyle = '#0a1240'
    ctx.strokeStyle = '#3d6bff'
    ctx.lineWidth = 2
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = MAZE[y][x]
        const left = OX + x * TILE
        const top = OY + y * TILE
        if (t === '#') {
          ctx.fillRect(left, top, TILE, TILE)
          // контур лише там, де стіна межує з вільним простором
          const open = (dx, dy) => tileAt(MAZE, x + dx, y + dy) !== '#'
          ctx.beginPath()
          const edge = (x1, y1, x2, y2) => {
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
          }
          if (open(0, -1)) edge(left, top + 1, left + TILE, top + 1)
          if (open(0, 1)) edge(left, top + TILE - 1, left + TILE, top + TILE - 1)
          if (open(-1, 0)) edge(left + 1, top, left + 1, top + TILE)
          if (open(1, 0)) edge(left + TILE - 1, top, left + TILE - 1, top + TILE)
          ctx.stroke()
        } else if (t === '-') {
          ctx.fillStyle = '#ff2a85'
          ctx.fillRect(left, top + TILE / 2 - 2, TILE, 4)
          ctx.fillStyle = '#0a1240'
        }
      }
    }
  }

  const drawDots = () => {
    ctx.fillStyle = '#ffe9b0'
    const blink = Math.floor(clock * 4) % 2 === 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (dots[y][x] === '.') ctx.fillRect(px(x) - 2, py(y) - 2, 4, 4)
        else if (dots[y][x] === 'o' && blink) {
          ctx.beginPath()
          ctx.arc(px(x), py(y), 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  const FACING_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }

  // Pac-Man із ротом, що відкривається; open — 0..1 для анімації смерті
  const drawPac = (x, y, facing, mouth, radius = 9) => {
    ctx.fillStyle = '#ffe600'
    ctx.beginPath()
    ctx.moveTo(x, y)
    const a = FACING_ANGLE[facing]
    ctx.arc(x, y, radius, a + mouth, a + Math.PI * 2 - mouth)
    ctx.closePath()
    ctx.fill()
  }

  const drawGhost = (g) => {
    const x = px(g.x)
    const y = py(g.y)
    const r = 9
    if (g.state !== 'eyes') {
      const flashing = g.frightened && frightTimer < 2 && Math.floor(clock * 6) % 2 === 0
      ctx.fillStyle = g.frightened ? (flashing ? '#ffffff' : '#2b4bff') : g.color
      ctx.beginPath()
      ctx.arc(x, y - 1, r, Math.PI, 0)
      ctx.lineTo(x + r, y + r)
      // «спідниця» з трьох зубців; зубці міняються, щоб привид «ворушився»
      const wave = Math.floor(clock * 8) % 2 === 0 ? 0 : 2
      for (let i = 0; i < 3; i++) {
        const sx = x + r - (i * 2 * r) / 3
        ctx.lineTo(sx - r / 3, y + r - wave - 3 * (i % 2 === 0 ? 1 : 0.2))
        ctx.lineTo(sx - (2 * r) / 3, y + r)
      }
      ctx.lineTo(x - r, y + r)
      ctx.closePath()
      ctx.fill()
    }
    if (g.frightened && g.state !== 'eyes') {
      // налякане обличчя
      ctx.fillStyle = '#ffd6a8'
      ctx.fillRect(x - 5, y - 4, 3, 3)
      ctx.fillRect(x + 2, y - 4, 3, 3)
    } else {
      // очі з зіницями, спрямованими за рухом
      const look = DIRS[g.dir || 'left']
      for (const ex of [-4, 4]) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(x + ex - 3, y - 6, 6, 7)
        ctx.fillStyle = '#1b2cff'
        ctx.fillRect(x + ex - 1 + look.x * 2, y - 4 + look.y * 2, 3, 3)
      }
    }
  }

  const draw = () => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    drawMaze()
    drawDots()

    // Pac-Man: під час смерті рот розкривається, поки герой не зникне
    if (deathTimer > 0) {
      const progress = 1 - deathTimer / 1.4
      if (progress < 0.95) drawPac(px(pac.x), py(pac.y), 'up', Math.PI * progress, 9)
    } else if (lives > 0 || status !== 'over') {
      const mouth = (0.08 + 0.3 * Math.abs(Math.sin(pac.mouth))) * Math.PI
      drawPac(px(pac.x), py(pac.y), pac.facing, mouth)
    }

    if (deathTimer <= 0) ghosts.forEach(drawGhost)

    ctx.font = '12px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    if (readyTimer > 0) {
      ctx.fillStyle = '#ffe600'
      ctx.fillText('ГОТУЙСЬ!', W / 2, py(9) + 4)
    }

    // Життя й рівень під лабіринтом
    for (let i = 0; i < lives; i++) drawPac(OX + 12 + i * 22, H - 10, 'right', 0.3 * Math.PI, 7)
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#39ff14'
    ctx.fillText(`РІВЕНЬ ${level}`, W - OX, H - 6)
  }

  const loop = (now) => {
    if (destroyed || status !== 'running') return
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 1 / 30)
    lastTime = now
    update(dt)
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
    // Розворот на 180° виконується одразу; поворот убік — коли з'явиться прохід
    setInput(name, pressed) {
      if (!pressed || !(name in DIRS)) return
      if (pac.dir && name === OPPOSITE[pac.dir]) {
        pac.dir = name
        pac.facing = name
        pac.next = null
      } else {
        pac.next = name
      }
    },
    releaseAll() {},
    destroy() {
      destroyed = true
      stopLoop()
    },
  }
}
