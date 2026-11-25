import { describe, expect, it } from 'vitest'
import { ALIEN_COUNT, bottomAliens, createAliens, stepFormation, stepInterval } from './InvadersEngine.js'

describe('createAliens', () => {
  it('створює шеренгу 11×5 = 55 живих прибульців', () => {
    const aliens = createAliens()
    expect(aliens).toHaveLength(ALIEN_COUNT)
    expect(aliens.every((a) => a.alive)).toBe(true)
  })
})

describe('stepFormation', () => {
  it('зсувається вбік, поки є місце', () => {
    const f = stepFormation({ x: 30, y: 50, dir: 1 }, createAliens())
    expect(f.x).toBeGreaterThan(30)
    expect(f.y).toBe(50)
    expect(f.dir).toBe(1)
  })

  it('біля правого краю опускається й змінює напрямок', () => {
    // права межа шеренги майже торкається краю екрана
    const f = stepFormation({ x: 125, y: 50, dir: 1 }, createAliens(), 480)
    expect(f.y).toBeGreaterThan(50)
    expect(f.dir).toBe(-1)
  })

  it('біля лівого краю опускається й змінює напрямок', () => {
    const f = stepFormation({ x: 10, y: 50, dir: -1 }, createAliens())
    expect(f.y).toBeGreaterThan(50)
    expect(f.dir).toBe(1)
  })

  it('якщо крайні колонки знищено, шеренга йде далі до краю', () => {
    const aliens = createAliens()
    aliens.forEach((a) => {
      if (a.col === 0 || a.col === 10) a.alive = false
    })
    const f = stepFormation({ x: 10, y: 50, dir: -1 }, aliens)
    expect(f.dir).toBe(-1)
    expect(f.x).toBeLessThan(10)
  })
})

describe('stepInterval', () => {
  it('чим менше прибульців, тим швидше рух', () => {
    expect(stepInterval(1)).toBeLessThan(stepInterval(30))
    expect(stepInterval(30)).toBeLessThan(stepInterval(55))
  })
  it('вищий рівень — швидше, але не швидше за мінімум', () => {
    expect(stepInterval(55, 3)).toBeLessThan(stepInterval(55, 1))
    expect(stepInterval(1, 20)).toBeGreaterThanOrEqual(0.025)
  })
})

describe('bottomAliens', () => {
  it('повертає найнижчого живого прибульця в кожній колонці', () => {
    const aliens = createAliens()
    const bottom = bottomAliens(aliens)
    expect(bottom).toHaveLength(11)
    expect(bottom.every((a) => a.row === 4)).toBe(true)
  })
  it('після загибелі нижнього стріляє той, що вище', () => {
    const aliens = createAliens()
    aliens.find((a) => a.col === 3 && a.row === 4).alive = false
    expect(bottomAliens(aliens).find((a) => a.col === 3).row).toBe(3)
  })
  it('порожня колонка не дає стрілка', () => {
    const aliens = createAliens()
    aliens.filter((a) => a.col === 0).forEach((a) => (a.alive = false))
    expect(bottomAliens(aliens)).toHaveLength(10)
  })
})
