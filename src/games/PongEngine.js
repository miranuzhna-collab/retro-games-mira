// Рушій Pong (1972) на Canvas. Матч до 5 очок проти комп'ютера.

const W = 480
const H = 360
const PADDLE_W = 8
const PADDLE_H = 56
const MARGIN = 16 // відступ ракеток від країв
const BALL = 8
const WIN_SCORE = 5

const PLAYER_SPEED = 280 // пікселів за секунду
const AI_SPEED = 170 // повільніша за гравця, щоб комп'ютера можна було обіграти
const BALL_START = 220
const BALL_STEP = 14 // прискорення м'яча після кожного удару ракеткою
const BALL_MAX = 520
const MAX_ANGLE = Math.PI / 3 // 60°: максимальний кут відскоку
const SERVE_DELAY = 0.8 // пауза перед подачею, секунд

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

// Відскок від ракетки: кут залежить від того, в яку частину ракетки влучив м'яч.
// Центр -> летить прямо, край -> під кутом до 60°. dirX: +1 вправо, -1 вліво.
export function paddleBounce(ballY, paddleCenterY, paddleH, dirX, speed) {
  const relative = clamp((ballY - paddleCenterY) / (paddleH / 2), -1, 1)
  const angle = relative * MAX_ANGLE
  return { vx: dirX * speed * Math.cos(angle), vy: speed * Math.sin(angle) }
}

export function createPongEngine(canvas, { play, onScore, onStatus, onGameOver }) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  let status = 'idle'
  let rafId = null
  let lastTime = null
  let destroyed = false

  const input = { up: false, down: false }
  let player, ai, ball, points, hits, serveTimer, aiOffset

  const setStatus = (s) => {
    status = s
    onStatus(s)
  }

  const totalScore = (won = false) => hits * 10 + points.player * 100 + (won ? 500 : 0)

  // Подача: м'яч у центрі летить до того, хто щойно пропустив (dirX)
  const serve = (dirX) => {
    const angle = (Math.random() - 0.5) * 0.8
    ball = {
      x: W / 2,
      y: H / 2,
      speed: BALL_START,
      vx: dirX * BALL_START * Math.cos(angle),
      vy: BALL_START * Math.sin(angle),
    }
    serveTimer = SERVE_DELAY
    aiOffset = (Math.random() - 0.5) * 30 // комп'ютер цілиться неточно
  }

  const reset = () => {
    player = { y: H / 2 - PADDLE_H / 2 }
    ai = { y: H / 2 - PADDLE_H / 2 }
    points = { player: 0, ai: 0 }
    hits = 0
    serve(Math.random() < 0.5 ? 1 : -1)
    onScore(0)
  }

  const finish = (won) => {
    const score = totalScore(won)
    onScore(score)
    play(won ? 'win' : 'gameover')
    setStatus('over')
    stopLoop()
    draw()
    onGameOver({ score, won })
  }

  const pointFor = (who) => {
    points[who]++
    play('score')
    onScore(totalScore())
    if (points[who] >= WIN_SCORE) {
      finish(who === 'player')
    } else {
      serve(who === 'player' ? 1 : -1)
    }
  }

  const update = (dt) => {
    // Ракетка гравця
    const dir = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    player.y = clamp(player.y + dir * PLAYER_SPEED * dt, 0, H - PADDLE_H)

    // Ракетка комп'ютера: слідкує за м'ячем, коли той летить до неї, інакше йде до центру
    const target = (ball.vx > 0 ? ball.y + aiOffset : H / 2) - PADDLE_H / 2
    const diff = target - ai.y
    if (Math.abs(diff) > 4) {
      ai.y = clamp(ai.y + Math.sign(diff) * Math.min(Math.abs(diff), AI_SPEED * dt), 0, H - PADDLE_H)
    }

    if (serveTimer > 0) {
      serveTimer -= dt
      return
    }

    const half = BALL / 2
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    // Верхня й нижня стіни
    if (ball.y - half < 0) {
      ball.y = half
      ball.vy = Math.abs(ball.vy)
      play('wall')
    } else if (ball.y + half > H) {
      ball.y = H - half
      ball.vy = -Math.abs(ball.vy)
      play('wall')
    }

    // Ракетка гравця (зліва)
    const pLeft = MARGIN
    const pRight = MARGIN + PADDLE_W
    if (
      ball.vx < 0 &&
      ball.x - half <= pRight &&
      ball.x + half >= pLeft &&
      ball.y + half >= player.y &&
      ball.y - half <= player.y + PADDLE_H
    ) {
      ball.speed = Math.min(ball.speed + BALL_STEP, BALL_MAX)
      Object.assign(ball, paddleBounce(ball.y, player.y + PADDLE_H / 2, PADDLE_H, 1, ball.speed))
      ball.x = pRight + half
      hits++
      onScore(totalScore())
      play('bounce')
    }

    // Ракетка комп'ютера (справа)
    const aLeft = W - MARGIN - PADDLE_W
    const aRight = W - MARGIN
    if (
      ball.vx > 0 &&
      ball.x + half >= aLeft &&
      ball.x - half <= aRight &&
      ball.y + half >= ai.y &&
      ball.y - half <= ai.y + PADDLE_H
    ) {
      ball.speed = Math.min(ball.speed + BALL_STEP, BALL_MAX)
      Object.assign(ball, paddleBounce(ball.y, ai.y + PADDLE_H / 2, PADDLE_H, -1, ball.speed))
      ball.x = aLeft - half
      play('bounce')
    }

    // М'яч пролетів повз ракетку: очко супернику
    if (ball.x + half < 0) pointFor('ai')
    else if (ball.x - half > W) pointFor('player')
  }

  const draw = () => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Пунктирна центральна лінія
    ctx.fillStyle = '#e6f7ff'
    for (let y = 0; y < H; y += 20) ctx.fillRect(W / 2 - 2, y + 4, 4, 12)

    // Рахунок матчу
    ctx.font = '32px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(points.player), W / 2 - 60, 56)
    ctx.fillText(String(points.ai), W / 2 + 60, 56)

    // Ракетки та м'яч
    ctx.fillRect(MARGIN, player.y, PADDLE_W, PADDLE_H)
    ctx.fillRect(W - MARGIN - PADDLE_W, ai.y, PADDLE_W, PADDLE_H)
    if (serveTimer <= 0 || Math.floor(serveTimer * 8) % 2 === 0) {
      ctx.fillRect(ball.x - BALL / 2, ball.y - BALL / 2, BALL, BALL)
    }
  }

  const loop = (now) => {
    if (destroyed || status !== 'running') return
    // Різниця часу між кадрами, обмежена зверху, щоб після переходу на іншу вкладку
    // м'яч не «телепортувався» крізь ракетку
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
    keymap: { ArrowUp: 'up', ArrowDown: 'down', w: 'up', s: 'down', W: 'up', S: 'down' },

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
      input.up = false
      input.down = false
    },
    // Обов'язково: інакше цикл анімації продовжить працювати після виходу зі сторінки
    destroy() {
      destroyed = true
      stopLoop()
    },
  }
}
