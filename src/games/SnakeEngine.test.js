import { describe, expect, it } from 'vitest'
import { advance, isOpposite, placeFood } from './SnakeEngine.js'

const base = (over = {}) => ({
  snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
  food: { x: 9, y: 9 },
  dir: 'right',
  cols: 10,
  rows: 10,
  ...over,
})

describe('advance', () => {
  it('змійка зсувається на одну клітинку, довжина не змінюється', () => {
    const r = advance(base())
    expect(r.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }])
    expect(r.dead).toBe(false)
    expect(r.ate).toBe(false)
  })

  it('з’їдена їжа подовжує змійку й створює нову їжу', () => {
    const r = advance(base({ food: { x: 6, y: 5 } }), () => 0)
    expect(r.ate).toBe(true)
    expect(r.snake).toHaveLength(4)
    expect(r.food).not.toEqual({ x: 6, y: 5 })
  })

  it('зіткнення зі стіною — смерть', () => {
    expect(advance(base({ dir: 'up', snake: [{ x: 2, y: 0 }, { x: 2, y: 1 }] })).dead).toBe(true)
    expect(advance(base({ snake: [{ x: 9, y: 2 }, { x: 8, y: 2 }] })).dead).toBe(true)
  })

  it('зіткнення з власним тілом — смерть', () => {
    const snake = [
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }, { x: 4, y: 4 },
    ]
    expect(advance({ snake, food: null, dir: 'left', cols: 10, rows: 10 }).dead).toBe(true)
  })

  it('у клітинку, яку щойно покидає хвіст, зайти можна', () => {
    // голова (1,1) іде вниз у (1,2), де зараз хвіст
    const snake = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }]
    expect(advance({ snake, food: null, dir: 'down', cols: 10, rows: 10 }).dead).toBe(false)
  })

  it('заповнене поле — перемога', () => {
    const snake = [{ x: 1, y: 0 }, { x: 0, y: 0 }]
    const r = advance({ snake, food: { x: 2, y: 0 }, dir: 'right', cols: 3, rows: 1 })
    expect(r.full).toBe(true)
  })
})

describe('isOpposite', () => {
  it('розпізнає розворот на 180°', () => {
    expect(isOpposite('left', 'right')).toBe(true)
    expect(isOpposite('up', 'down')).toBe(true)
    expect(isOpposite('up', 'left')).toBe(false)
  })
})

describe('placeFood', () => {
  it('ніколи не ставить їжу на змійку', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
    for (let i = 0; i < 50; i++) {
      const f = placeFood(snake, 2, 2)
      expect(snake.some((c) => c.x === f.x && c.y === f.y)).toBe(false)
    }
  })
  it('повертає null, коли вільних клітинок немає', () => {
    expect(placeFood([{ x: 0, y: 0 }], 1, 1)).toBeNull()
  })
})
