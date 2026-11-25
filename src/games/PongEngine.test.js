import { describe, expect, it } from 'vitest'
import { paddleBounce } from './PongEngine.js'

describe('paddleBounce', () => {
  it('удар у центр ракетки — м’яч летить прямо', () => {
    const { vx, vy } = paddleBounce(100, 100, 56, 1, 300)
    expect(vx).toBeCloseTo(300)
    expect(vy).toBeCloseTo(0)
  })

  it('удар у нижній край — м’яч летить вниз під 60°', () => {
    const { vx, vy } = paddleBounce(128, 100, 56, 1, 300)
    expect(vy).toBeGreaterThan(0)
    expect(Math.atan2(vy, vx)).toBeCloseTo(Math.PI / 3)
  })

  it('удар у верхній край — м’яч летить вгору', () => {
    expect(paddleBounce(72, 100, 56, 1, 300).vy).toBeLessThan(0)
  })

  it('напрямок по X залежить від dirX, а швидкість зберігається', () => {
    const { vx, vy } = paddleBounce(110, 100, 56, -1, 300)
    expect(vx).toBeLessThan(0)
    expect(Math.hypot(vx, vy)).toBeCloseTo(300)
  })

  it('влучання поза ракеткою не дає кут більше 60°', () => {
    const { vx, vy } = paddleBounce(500, 100, 56, 1, 300)
    expect(Math.atan2(vy, vx)).toBeCloseTo(Math.PI / 3)
  })
})
