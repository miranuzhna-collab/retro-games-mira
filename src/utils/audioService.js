// Синтезатор 8-бітних звуків на Web Audio API (без mp3-файлів).
// Кожен звук — це послідовність коротких тонів, які грає осцилятор,
// або шум (для вибухів). Гучність плавно згасає, щоб не було клацань.

let ctx = null // AudioContext створюємо ліниво: браузери дозволяють звук лише після кліку
let enabled = true // глобальний тумблер звуку (керується з SettingsContext)

export const setSoundEnabled = (value) => {
  enabled = value
}

const getContext = () => {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null // дуже старий браузер: просто мовчимо
    ctx = new Ctor()
  }
  // Після автоблокування браузера контекст «спить», будимо його
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Один тон: тип хвилі, частота (Гц), початок (с від зараз), тривалість (с), гучність
const tone = (c, { type = 'square', freq, start = 0, duration = 0.1, volume = 0.15, slideTo }) => {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  // slideTo — плавна зміна висоти (для лазера, програшу)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration)
}

// Шум, що згасає: основа вибуху
const noise = (c, { duration = 0.3, volume = 0.2 }) => {
  const length = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, length, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  const gain = c.createGain()
  src.buffer = buffer
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
  src.connect(gain).connect(c.destination)
  src.start()
}

// Каталог звуків, які використовують ігри
const SOUNDS = {
  select: (c) => tone(c, { freq: 660, duration: 0.08 }), // тумблер, меню
  start: (c) => {
    ;[392, 523, 659].forEach((freq, i) => tone(c, { freq, start: i * 0.09, duration: 0.09 }))
  },
  bounce: (c) => tone(c, { freq: 440, duration: 0.05 }), // відскок м'яча
  wall: (c) => tone(c, { freq: 220, duration: 0.05 }),
  score: (c) => tone(c, { freq: 880, duration: 0.2, slideTo: 440 }), // очко
  shoot: (c) => tone(c, { type: 'sawtooth', freq: 900, slideTo: 150, duration: 0.15, volume: 0.1 }),
  explosion: (c) => noise(c, { duration: 0.35 }), // загибель прибульця / гравця
  eat: (c) => {
    // поїдання крапки / їжі змійкою
    tone(c, { freq: 520, duration: 0.05 })
    tone(c, { freq: 780, start: 0.05, duration: 0.05 })
  },
  move: (c) => tone(c, { freq: 300, duration: 0.03, volume: 0.08 }), // зсув / поворот фігури
  line: (c) => {
    // спалювання ліній у Тетрісі
    ;[523, 659, 784, 1047].forEach((freq, i) => tone(c, { freq, start: i * 0.06, duration: 0.08 }))
  },
  // чотири низькі ноти «маршу» прибульців, що повторюються по колу
  march0: (c) => tone(c, { freq: 110, duration: 0.07, volume: 0.12 }),
  march1: (c) => tone(c, { freq: 98, duration: 0.07, volume: 0.12 }),
  march2: (c) => tone(c, { freq: 87, duration: 0.07, volume: 0.12 }),
  march3: (c) => tone(c, { freq: 82, duration: 0.07, volume: 0.12 }),
  ufo: (c) => tone(c, { type: 'triangle', freq: 700, slideTo: 950, duration: 0.12, volume: 0.1 }),
  // «ака-ака» Pac-Man: дві ноти чергуються при поїданні крапок
  waka0: (c) => tone(c, { freq: 330, duration: 0.05, volume: 0.08 }),
  waka1: (c) => tone(c, { freq: 250, duration: 0.05, volume: 0.08 }),
  death: (c) => tone(c, { type: 'triangle', freq: 600, slideTo: 60, duration: 1, volume: 0.15 }),
  gameover: (c) => tone(c, { type: 'triangle', freq: 440, slideTo: 80, duration: 0.8, volume: 0.2 }),
  win: (c) => {
    ;[523, 659, 784, 1047, 784, 1047].forEach((freq, i) =>
      tone(c, { freq, start: i * 0.1, duration: 0.1 }),
    )
  },
}

// Відтворює звук за назвою. force=true ігнорує тумблер
// (потрібно, коли користувач щойно сам увімкнув звук).
export const playSound = (name, { force = false } = {}) => {
  if (!enabled && !force) return
  const sound = SOUNDS[name]
  if (!sound) return
  try {
    const c = getContext()
    if (c) sound(c)
  } catch {
    /* звук не критичний: гра працює і без нього */
  }
}
