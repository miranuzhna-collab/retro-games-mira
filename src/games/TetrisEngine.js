// Рушій Tetris (1984) на Canvas: стакан 10×20, 7 фігур, обертання, лінії, рівні.
// Уся ігрова логіка (колізії, обертання, лінії, очки) — чисті функції без Canvas.

const W = 480
const H = 360

export const COLS = 10
export const ROWS = 20
const CELL = 17
const WELL_X = 65 // лівий верхній кут стакана на полотні
const WELL_Y = 10
const PANEL_X = 275

const DAS_DELAY = 0.17 // затримка перед автоповтором руху вбік
const DAS_REPEAT = 0.05 // швидкість автоповтору
const SOFT_DROP_INTERVAL = 0.04
const LINES_PER_LEVEL = 10

// Сім тетраміно. Матриця: 1 — клітинка фігури.
export const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
}
export const TYPES = Object.keys(SHAPES)

const COLORS = {
  I: '#00f3ff',
  O: '#ffe600',
  T: '#c04bff',
  S: '#39ff14',
  Z: '#ff2a85',
  J: '#3d6bff',
  L: '#ff9a1f',
}

// ---------- Чиста логіка ----------

export const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

// Поворот матриці на 90° за годинниковою стрілкою
export const rotateMatrix = (m) => m.map((_, c) => m.map((row) => row[c]).reverse())

// Чи фігура (matrix у позиції x, y) виходить за стакан або налягає на зайняті клітинки
export function collides(board, matrix, x, y) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue
      const bx = x + c
      const by = y + r
      if (bx < 0 || bx >= COLS || by >= ROWS) return true
      if (by >= 0 && board[by][bx]) return true
    }
  }
  return false
}

// Повертає нове поле з вписаною фігурою (старе не змінює)
export function merge(board, matrix, x, y, type) {
  const next = board.map((row) => [...row])
  matrix.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell && y + r >= 0) next[y + r][x + c] = type
    }),
  )
  return next
}

// Прибирає заповнені ряди; зверху додає порожні. Повертає { board, cleared }.
export function clearLines(board) {
  const kept = board.filter((row) => row.some((cell) => !cell))
  const cleared = board.length - kept.length
  const fresh = Array.from({ length: cleared }, () => Array(COLS).fill(null))
  return { board: [...fresh, ...kept], cleared }
}

// Обертання з «підштовхуванням» від стін: пробуємо кілька зсувів по горизонталі.
// Повертає нову фігуру або null, якщо повернути неможливо.
export function tryRotate(board, piece) {
  const matrix = rotateMatrix(piece.matrix)
  for (const dx of [0, -1, 1, -2, 2]) {
    if (!collides(board, matrix, piece.x + dx, piece.y)) return { ...piece, matrix, x: piece.x + dx }
  }
  return null
}

// Де фігура приземлиться, якщо її скинути вниз (для «тіні»)
export function landingY(board, piece) {
  let y = piece.y
  while (!collides(board, piece.matrix, piece.x, y + 1)) y++
  return y
}

export const levelFor = (totalLines) => Math.floor(totalLines / LINES_PER_LEVEL) + 1

// Очки за ряди: 1 — 100, 2 — 300, 3 — 500, 4 («тетріс») — 800, помножені на рівень
export const lineScore = (cleared, level) => [0, 100, 300, 500, 800][cleared] * level

// Пауза між кроками падіння: з рівнем фігури падають швидше
export const gravityInterval = (level) => Math.max(0.05, 0.8 * Math.pow(0.85, level - 1))

// Перемішування (Фішер–Єйтс) для «мішка» з 7 фігур: кожна випадає рівно раз за мішок
export function shuffle(items, random = Math.random) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const spawnPiece = (type) => {
  const matrix = SHAPES[type].map((row) => [...row])
  return { type, matrix, x: Math.floor((COLS - matrix[0].length) / 2), y: 0 }
}

// ---------- Рушій ----------

export function createTetrisEngine(canvas, { play, onScore, onStatus, onGameOver }) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  let status = 'idle'
  let rafId = null
  let lastTime = null
  let destroyed = false

  const input = { left: false, right: false, down: false }
  let board, piece, nextType, bag, score, lines, level
  let fallTimer, dasDir, dasTimer
  let rotateHeld = false

  const setStatus = (s) => {
    status = s
    onStatus(s)
  }

  const drawFromBag = () => {
    if (!bag.length) bag = shuffle(TYPES)
    return bag.pop()
  }

  const addScore = (points) => {
    if (!points) return
    score += points
    onScore(score)
  }

  // Нова фігура зверху; якщо їй немає місця — стакан переповнений
  const spawn = () => {
    piece = spawnPiece(nextType)
    nextType = drawFromBag()
    fallTimer = 0
    if (collides(board, piece.matrix, piece.x, piece.y)) finish()
  }

  const reset = () => {
    board = createBoard()
    bag = []
    score = 0
    lines = 0
    level = 1
    dasDir = null
    dasTimer = 0
    nextType = drawFromBag()
    spawn()
    onScore(0)
  }

  const finish = () => {
    play('gameover')
    setStatus('over')
    stopLoop()
    draw()
    onGameOver({ score, won: false })
  }

  const tryMove = (dx) => {
    if (collides(board, piece.matrix, piece.x + dx, piece.y)) return false
    piece.x += dx
    play('move')
    return true
  }

  const rotate = () => {
    const rotated = tryRotate(board, piece)
    if (rotated) {
      piece = rotated
      play('move')
    }
  }

  // Фігура приземлилась: вписуємо в поле, спалюємо ряди, випускаємо наступну
  const lock = () => {
    board = merge(board, piece.matrix, piece.x, piece.y, piece.type)
    const result = clearLines(board)
    board = result.board
    if (result.cleared) {
      addScore(lineScore(result.cleared, level))
      lines += result.cleared
      level = levelFor(lines)
      play('line')
    } else {
      play('wall')
    }
    spawn()
  }

  const update = (dt) => {
    // Автоповтор руху вбік, поки клавішу утримують
    if (dasDir && input[dasDir]) {
      dasTimer -= dt
      while (dasTimer <= 0) {
        tryMove(dasDir === 'left' ? -1 : 1)
        dasTimer += DAS_REPEAT
      }
    }

    // Падіння: утримання «вниз» прискорює його
    const interval = input.down ? Math.min(SOFT_DROP_INTERVAL, gravityInterval(level)) : gravityInterval(level)
    fallTimer += dt
    while (fallTimer >= interval && status === 'running') {
      fallTimer -= interval
      if (!collides(board, piece.matrix, piece.x, piece.y + 1)) {
        piece.y++
        if (input.down) addScore(1) // 1 очко за кожну клітинку прискореного падіння
      } else {
        lock()
        break
      }
    }
  }

  const drawCell = (x, y, color, size = CELL) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, size, size)
    // світла «грань» зверху й темна знизу дають об'ємний ретро-вигляд
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(x, y, size, 2)
    ctx.fillRect(x, y, 2, size)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(x, y + size - 2, size, 2)
    ctx.fillRect(x + size - 2, y, 2, size)
  }

  const drawMatrix = (matrix, ox, oy, color, size = CELL) =>
    matrix.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) drawCell(ox + c * size, oy + r * size, color, size)
      }),
    )

  const draw = () => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Стакан: фон, сітка, зайняті клітинки
    ctx.fillStyle = '#05070f'
    ctx.fillRect(WELL_X, WELL_Y, COLS * CELL, ROWS * CELL)
    ctx.strokeStyle = 'rgba(0,243,255,0.08)'
    ctx.lineWidth = 1
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(WELL_X + c * CELL + 0.5, WELL_Y)
      ctx.lineTo(WELL_X + c * CELL + 0.5, WELL_Y + ROWS * CELL)
      ctx.stroke()
    }
    board.forEach((row, r) =>
      row.forEach((type, c) => {
        if (type) drawCell(WELL_X + c * CELL, WELL_Y + r * CELL, COLORS[type])
      }),
    )

    // «Тінь» і активна фігура
    if (status !== 'over') {
      const gy = landingY(board, piece)
      ctx.strokeStyle = COLORS[piece.type]
      ctx.globalAlpha = 0.35
      piece.matrix.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell) ctx.strokeRect(WELL_X + (piece.x + c) * CELL + 1.5, WELL_Y + (gy + r) * CELL + 1.5, CELL - 3, CELL - 3)
        }),
      )
      ctx.globalAlpha = 1
      drawMatrix(piece.matrix, WELL_X + piece.x * CELL, WELL_Y + piece.y * CELL, COLORS[piece.type])
    }

    ctx.strokeStyle = '#00f3ff'
    ctx.lineWidth = 2
    ctx.strokeRect(WELL_X - 1, WELL_Y - 1, COLS * CELL + 2, ROWS * CELL + 2)

    // Бокова панель: наступна фігура, рівень, лінії
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffe600'
    ctx.fillText('ДАЛІ', PANEL_X, 30)
    ctx.strokeStyle = '#ff2a85'
    ctx.strokeRect(PANEL_X, 40, 100, 70)
    const next = SHAPES[nextType]
    const size = 16
    drawMatrix(
      next,
      PANEL_X + (100 - next[0].length * size) / 2,
      40 + (70 - next.length * size) / 2,
      COLORS[nextType],
      size,
    )
    ctx.fillStyle = '#39ff14'
    ctx.fillText('РІВЕНЬ', PANEL_X, 150)
    ctx.fillStyle = '#e6f7ff'
    ctx.fillText(String(level), PANEL_X, 172)
    ctx.fillStyle = '#39ff14'
    ctx.fillText('ЛІНІЇ', PANEL_X, 210)
    ctx.fillStyle = '#e6f7ff'
    ctx.fillText(String(lines), PANEL_X, 232)
  }

  const loop = (now) => {
    if (destroyed || status !== 'running') return
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1)
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
      ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate', ' ': 'rotate',
      a: 'left', d: 'right', s: 'down', w: 'rotate',
      A: 'left', D: 'right', S: 'down', W: 'rotate',
    },

    start() {
      if (destroyed) return
      stopLoop()
      input.left = input.right = input.down = false
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
    // Рух вбік і поворот спрацьовують у момент натискання; повторні події утримання ігноруємо
    setInput(name, pressed) {
      const action = name === 'up' ? 'rotate' : name // кнопка ▲ на D-Pad — теж поворот
      if (action === 'rotate') {
        // Повторні keydown від утримання клавіші не крутять фігуру знову і знову
        if (pressed && !rotateHeld && status === 'running') rotate()
        rotateHeld = pressed
        return
      }
      if (!(action in input)) return
      if (pressed === input[action]) return
      input[action] = pressed
      if (action === 'down') return
      if (pressed) {
        dasDir = action
        dasTimer = DAS_DELAY
        if (status === 'running') tryMove(action === 'left' ? -1 : 1)
      } else if (dasDir === action) {
        dasDir = input.left ? 'left' : input.right ? 'right' : null
        dasTimer = DAS_DELAY
      }
    },
    releaseAll() {
      input.left = input.right = input.down = false
      rotateHeld = false
      dasDir = null
    },
    destroy() {
      destroyed = true
      stopLoop()
    },
  }
}
