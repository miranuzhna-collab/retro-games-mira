// Рушій Space Invaders (1978) на Canvas.
// Логіка шеренги прибульців винесена в чисті функції (без Canvas) для тестування.

const W = 480
const H = 360

// ---- Шеренга прибульців ----
const COLS = 11
const ROWS = 5
const SP_X = 32 // відстань між центрами прибульців по горизонталі
const SP_Y = 24 // і по вертикалі
const CELL_W = 24 // «клітинка» прибульця; менші спрайти центруються в ній
const ALIEN_H = 16
const STEP_X = 6 // крок шеренги вбік
const DROP_Y = 16 // на скільки шеренга опускається біля краю
const EDGE = 10 // відступ від країв екрана
const START_X = 30
const START_Y = 50

// ---- Гравець і снаряди ----
const PLAYER_W = 26
const PLAYER_H = 12
const PLAYER_Y = H - 44
const PLAYER_SPEED = 220
const BULLET_SPEED = 380
const BOMB_SPEED = 160
const MAX_BOMBS = 3
const START_LIVES = 3
const INVULNERABLE_TIME = 1.5 // секунд нестямності після влучання

// Очки: верхній ряд дорожчий. Ряд 0 — «кальмар», 1–2 — «краб», 3–4 — «восьминіг»
const ROW_POINTS = [30, 20, 20, 10, 10]
const UFO_POINTS = [50, 100, 150, 300]

export const ALIEN_COUNT = COLS * ROWS

// Створює 55 прибульців (11×5)
export function createAliens() {
  const aliens = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) aliens.push({ col, row, alive: true })
  }
  return aliens
}

// Рух шеренги: крок убік; якщо наступний крок виходить за край, шеренга
// опускається вниз і змінює напрямок. Повертає нову шеренгу { x, y, dir }.
export function stepFormation({ x, y, dir }, aliens, width = W) {
  const alive = aliens.filter((a) => a.alive)
  if (!alive.length) return { x, y, dir }
  const minCol = Math.min(...alive.map((a) => a.col))
  const maxCol = Math.max(...alive.map((a) => a.col))
  const left = x + minCol * SP_X + dir * STEP_X
  const right = x + maxCol * SP_X + CELL_W + dir * STEP_X
  if (left < EDGE || right > width - EDGE) return { x, y: y + DROP_Y, dir: -dir }
  return { x: x + dir * STEP_X, y, dir }
}

// Час між кроками шеренги: чим менше прибульців і вищий рівень, тим швидше.
// Цей ефект став знаменитою «особливістю» оригінальної гри.
export function stepInterval(aliveCount, level = 1) {
  const base = 0.04 + 0.6 * (aliveCount / ALIEN_COUNT)
  return Math.max(0.025, base * Math.pow(0.9, level - 1))
}

// Найнижчий живий прибулець у кожній колонці: лише вони можуть скидати бомби
export function bottomAliens(aliens) {
  const lowest = new Map()
  for (const a of aliens) {
    if (a.alive && (!lowest.has(a.col) || a.row > lowest.get(a.col).row)) lowest.set(a.col, a)
  }
  return [...lowest.values()]
}

// ---- Спрайти (X — піксель), малюються з масштабом 2 ----
const SPRITES = {
  squid: [
    [
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '..X..X..',
      '.X.XX.X.',
      'X.X..X.X',
    ],
    [
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '.X.XX.X.',
      'X......X',
      '.X....X.',
    ],
  ],
  crab: [
    [
      '..X.....X..',
      '...X...X...',
      '..XXXXXXX..',
      '.XX.XXX.XX.',
      'XXXXXXXXXXX',
      'X.XXXXXXX.X',
      'X.X.....X.X',
      '...XX.XX...',
    ],
    [
      '..X.....X..',
      'X..X...X..X',
      'X.XXXXXXX.X',
      'XXX.XXX.XXX',
      'XXXXXXXXXXX',
      '.XXXXXXXXX.',
      '..X.....X..',
      '.X.......X.',
    ],
  ],
  octopus: [
    [
      '....XXXX....',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      'XXX..XX..XXX',
      'XXXXXXXXXXXX',
      '...XX..XX...',
      '..XX.XX.XX..',
      'XX........XX',
    ],
    [
      '....XXXX....',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      'XXX..XX..XXX',
      'XXXXXXXXXXXX',
      '..XXX..XXX..',
      '.XX..XX..XX.',
      '..XX....XX..',
    ],
  ],
}
const CANNON = [
  '......X......',
  '.....XXX.....',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
]
const UFO = [
  '.....XXXXXX.....',
  '...XXXXXXXXXX...',
  '..XXXXXXXXXXXX..',
  '.XX.XX.XX.XX.XX.',
  'XXXXXXXXXXXXXXXX',
  '..XXX..XX..XXX..',
  '...X........X...',
]
const SCALE = 2

// Тип і колір прибульця за номером ряду
const alienLook = (row) => {
  if (row === 0) return { sprites: SPRITES.squid, color: '#ff2a85' }
  if (row <= 2) return { sprites: SPRITES.crab, color: '#00f3ff' }
  return { sprites: SPRITES.octopus, color: '#ffe600' }
}

const spriteWidth = (rows) => rows[0].length * SCALE

const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export function createInvadersEngine(canvas, { play, onScore, onStatus, onGameOver }) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  let status = 'idle'
  let rafId = null
  let lastTime = null
  let destroyed = false

  const input = { left: false, right: false, fire: false }

  let aliens, formation, player, bullet, bombs, bunkers, ufo, effects
  let score, lives, level, frame, marchIndex
  let stepTimer, bombTimer, ufoTimer, levelPause, invulnerable

  const setStatus = (s) => {
    status = s
    onStatus(s)
  }

  const addScore = (points) => {
    score += points
    onScore(score)
  }

  // Захисні укриття: 4 бункери з блоків 6×6, які руйнуються при влучанні
  const buildBunkers = () => {
    const blocks = []
    for (let b = 0; b < 4; b++) {
      const bx = Math.round(((b + 0.5) * W) / 4 - 18)
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          if (r === 2 && (c === 2 || c === 3)) continue // «арка» знизу
          blocks.push({ x: bx + c * 6, y: H - 96 + r * 6, w: 6, h: 6 })
        }
      }
    }
    return blocks
  }

  const newWave = () => {
    aliens = createAliens()
    formation = { x: START_X, y: Math.min(START_Y + (level - 1) * 8, 90), dir: 1 }
    bullet = null
    bombs = []
    bunkers = buildBunkers()
    ufo = null
    effects = []
    stepTimer = 0
    bombTimer = 1
    ufoTimer = 12 + Math.random() * 8
    levelPause = 1
  }

  const reset = () => {
    score = 0
    lives = START_LIVES
    level = 1
    frame = 0
    marchIndex = 0
    invulnerable = 0
    player = { x: W / 2 - PLAYER_W / 2 }
    newWave()
    onScore(0)
  }

  const finish = () => {
    play('gameover')
    setStatus('over')
    stopLoop()
    draw()
    onGameOver({ score, won: false })
  }

  // Прямокутник прибульця в поточний момент
  const alienRect = (a) => {
    const w = spriteWidth(alienLook(a.row).sprites[0])
    return {
      x: formation.x + a.col * SP_X + (CELL_W - w) / 2,
      y: formation.y + a.row * SP_Y,
      w,
      h: ALIEN_H,
    }
  }

  const hitBunker = (rect) => {
    const i = bunkers.findIndex((b) => overlaps(rect, b))
    if (i === -1) return false
    bunkers.splice(i, 1)
    return true
  }

  const playerRect = () => ({ x: player.x, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H })

  const loseLife = () => {
    lives--
    play('explosion')
    effects.push({ x: player.x + PLAYER_W / 2, y: PLAYER_Y + 6, t: 0.4 })
    bombs = []
    if (lives <= 0) return finish()
    invulnerable = INVULNERABLE_TIME
    player.x = W / 2 - PLAYER_W / 2
  }

  const update = (dt) => {
    // Гравець
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    player.x = Math.max(EDGE, Math.min(W - EDGE - PLAYER_W, player.x + dir * PLAYER_SPEED * dt))
    if (invulnerable > 0) invulnerable -= dt

    // Постріл: у кожен момент на екрані лише один снаряд гравця
    if (input.fire && !bullet) {
      bullet = { x: player.x + PLAYER_W / 2 - 1, y: PLAYER_Y - 8 }
      play('shoot')
    }

    // Ефекти вибухів
    effects.forEach((e) => (e.t -= dt))
    effects = effects.filter((e) => e.t > 0)

    // Пауза між хвилями
    if (levelPause > 0) {
      levelPause -= dt
      return
    }

    // Снаряд гравця
    if (bullet) {
      bullet.y -= BULLET_SPEED * dt
      const rect = { x: bullet.x, y: bullet.y, w: 3, h: 10 }
      if (bullet.y + 10 < 0) {
        bullet = null
      } else if (hitBunker(rect)) {
        bullet = null
      } else if (ufo && overlaps(rect, { x: ufo.x, y: 30, w: 32, h: 14 })) {
        const points = UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)]
        addScore(points)
        effects.push({ x: ufo.x + 16, y: 37, t: 0.3 })
        play('explosion')
        ufo = null
        bullet = null
      } else {
        const target = aliens.find((a) => a.alive && overlaps(rect, alienRect(a)))
        if (target) {
          target.alive = false
          const r = alienRect(target)
          effects.push({ x: r.x + r.w / 2, y: r.y + r.h / 2, t: 0.2 })
          addScore(ROW_POINTS[target.row])
          play('explosion')
          bullet = null
        }
      }
    }

    // Бомби прибульців
    for (const b of bombs) b.y += BOMB_SPEED * dt
    const bombRect = (b) => ({ x: b.x, y: b.y, w: 3, h: 10 })
    for (const b of bombs) {
      if (hitBunker(bombRect(b))) b.dead = true
      else if (invulnerable <= 0 && overlaps(bombRect(b), playerRect())) {
        b.dead = true
        loseLife()
        if (status !== 'running') return
        break
      } else if (b.y > H - 30) b.dead = true
    }
    bombs = bombs.filter((b) => !b.dead)

    // Нова бомба: випадковий нижній прибулець
    bombTimer -= dt
    if (bombTimer <= 0 && bombs.length < MAX_BOMBS) {
      const shooters = bottomAliens(aliens)
      if (shooters.length) {
        const r = alienRect(shooters[Math.floor(Math.random() * shooters.length)])
        bombs.push({ x: r.x + r.w / 2 - 1, y: r.y + r.h })
      }
      bombTimer = (0.7 + Math.random() * 1.1) / (1 + 0.15 * (level - 1))
    }

    // НЛО пролітає зрідка у верхній частині
    if (ufo) {
      ufo.x += ufo.dir * 90 * dt
      if (ufo.x < -40 || ufo.x > W + 8) ufo = null
    } else {
      ufoTimer -= dt
      if (ufoTimer <= 0) {
        const fromLeft = Math.random() < 0.5
        ufo = { x: fromLeft ? -32 : W, dir: fromLeft ? 1 : -1 }
        ufoTimer = 15 + Math.random() * 10
        play('ufo')
      }
    }

    // Крок шеренги
    stepTimer -= dt
    const aliveCount = aliens.filter((a) => a.alive).length
    if (stepTimer <= 0 && aliveCount > 0) {
      formation = stepFormation(formation, aliens)
      frame = 1 - frame
      stepTimer = stepInterval(aliveCount, level)
      play(`march${marchIndex}`)
      marchIndex = (marchIndex + 1) % 4

      // Прибульці зносять укриття, до яких дісталися, і виграють, діставшись гравця
      for (const a of aliens) {
        if (!a.alive) continue
        const r = alienRect(a)
        while (hitBunker(r)); // знесли всі блоки укриття під прибульцем
        if (r.y + r.h >= PLAYER_Y) {
          lives = 0
          return finish()
        }
      }
    }

    // Усіх знищено: нова, швидша хвиля
    if (aliveCount === 0) {
      level++
      addScore(100 * (level - 1))
      play('win')
      newWave()
    }
  }

  const drawSprite = (rows, x, y, color) => {
    ctx.fillStyle = color
    rows.forEach((line, r) => {
      for (let c = 0; c < line.length; c++) {
        if (line[c] === 'X') ctx.fillRect(Math.round(x + c * SCALE), Math.round(y + r * SCALE), SCALE, SCALE)
      }
    })
  }

  const draw = () => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Прибульці
    for (const a of aliens) {
      if (!a.alive) continue
      const r = alienRect(a)
      const look = alienLook(a.row)
      drawSprite(look.sprites[frame], r.x, r.y, look.color)
    }

    // НЛО
    if (ufo) drawSprite(UFO, ufo.x, 30, '#ff2a85')

    // Укриття
    ctx.fillStyle = '#39ff14'
    for (const b of bunkers) ctx.fillRect(b.x, b.y, b.w, b.h)

    // Гармата (під час нестямності мигає)
    if (invulnerable <= 0 || Math.floor(invulnerable * 10) % 2 === 0) {
      drawSprite(CANNON, player.x, PLAYER_Y, '#39ff14')
    }

    // Снаряди
    ctx.fillStyle = '#e6f7ff'
    if (bullet) ctx.fillRect(bullet.x, bullet.y, 3, 10)
    ctx.fillStyle = '#ffe600'
    for (const b of bombs) ctx.fillRect(b.x, b.y, 3, 10)

    // Вибухи
    ctx.fillStyle = '#e6f7ff'
    for (const e of effects) {
      ctx.fillRect(e.x - 8, e.y - 1, 16, 2)
      ctx.fillRect(e.x - 1, e.y - 8, 2, 16)
      ctx.fillRect(e.x - 5, e.y - 5, 3, 3)
      ctx.fillRect(e.x + 2, e.y + 2, 3, 3)
    }

    // Лінія землі, життя та рівень
    ctx.fillStyle = '#39ff14'
    ctx.fillRect(0, H - 30, W, 2)
    for (let i = 0; i < lives; i++) drawSprite(CANNON, 12 + i * 30, H - 20, '#39ff14')
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`РІВЕНЬ ${level}`, W - 12, H - 10)
  }

  const loop = (now) => {
    if (destroyed || status !== 'running') return
    // Крок часу обмежений, щоб снаряди не «перестрибували» об'єкти після затримки
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
      ArrowLeft: 'left', ArrowRight: 'right', a: 'left', d: 'right', A: 'left', D: 'right',
      ' ': 'fire',
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
    setInput(name, pressed) {
      if (name in input) input[name] = pressed
    },
    releaseAll() {
      input.left = input.right = input.fire = false
    },
    destroy() {
      destroyed = true
      stopLoop()
    },
  }
}
