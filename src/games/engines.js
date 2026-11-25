// Реєстр ігрових рушіїв: slug гри -> фабрика рушія.
// Якщо гри тут немає, GamePage показує на автоматі напис «СКОРО».
//
// КОНТРАКТ РУШІЯ. Фабрика приймає canvas та колбеки:
//   createXEngine(canvas, { play, onScore(score), onStatus(status), onGameOver({ score, won }) })
// і повертає об'єкт:
//   keymap          — { 'ArrowUp': 'up', 'w': 'up', ... } клавіші -> назви дій
//   start()         — нова гра (з 'idle' або 'over')
//   pause() / resume() / togglePause()
//   setInput(name, pressed) — дія натиснута/відпущена (клавіатура й екранні кнопки)
//   releaseAll()    — відпустити всі дії (при втраті фокусу)
//   destroy()       — зупинити цикл анімації; викликається при виході зі сторінки
// Статуси: 'idle' | 'running' | 'paused' | 'over'.
import { createInvadersEngine } from './InvadersEngine.js'
import { createPacmanEngine } from './PacmanEngine.js'
import { createPongEngine } from './PongEngine.js'
import { createSnakeEngine } from './SnakeEngine.js'
import { createTetrisEngine } from './TetrisEngine.js'

export const ENGINES = {
  pong: createPongEngine,
  pacman: createPacmanEngine,
  invaders: createInvadersEngine,
  snake: createSnakeEngine,
  tetris: createTetrisEngine,
}
