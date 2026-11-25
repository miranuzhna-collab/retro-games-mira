// Обгортка над localStorage. Усі виклики в try/catch, бо сховище
// може бути недоступним (приватний режим, заблоковані cookies).

const SCORE_PREFIX = 'retro_arcade_score_'
const SETTINGS_KEY = 'retro_arcade_settings'

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ігноруємо: гра працює і без збереження */
  }
}

// ---- Рекорди ----
export const getScore = (slug) => Number(read(SCORE_PREFIX + slug)) || 0

// Зберігає рахунок, лише якщо він кращий за рекорд. Повертає true, якщо це новий рекорд.
export const setScoreIfBest = (slug, score) => {
  if (score <= getScore(slug)) return false
  write(SCORE_PREFIX + slug, String(score))
  return true
}

export const resetScores = (slugs) => {
  slugs.forEach((slug) => {
    try {
      localStorage.removeItem(SCORE_PREFIX + slug)
    } catch {
      /* див. вище */
    }
  })
}

// ---- Налаштування (звук, CRT) ----
const DEFAULT_SETTINGS = { soundOn: true, crtOn: true }

export const loadSettings = () => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(read(SETTINGS_KEY)) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (settings) => write(SETTINGS_KEY, JSON.stringify(settings))
