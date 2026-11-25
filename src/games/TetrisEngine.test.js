import { describe, expect, it } from 'vitest'
import {
  COLS, ROWS, SHAPES, TYPES, clearLines, collides, createBoard, gravityInterval,
  landingY, levelFor, lineScore, merge, rotateMatrix, shuffle, spawnPiece, tryRotate,
} from './TetrisEngine.js'

describe('фігури та обертання', () => {
  it('є 7 фігур по 4 клітинки кожна', () => {
    expect(TYPES.sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z'])
    for (const t of TYPES) expect(SHAPES[t].flat().filter(Boolean)).toHaveLength(4)
  })

  it('чотири повороти повертають фігуру в початковий вигляд', () => {
    for (const t of TYPES) {
      let m = SHAPES[t]
      for (let i = 0; i < 4; i++) m = rotateMatrix(m)
      expect(m).toEqual(SHAPES[t])
    }
  })

  it('поворот T за годинниковою стрілкою', () => {
    expect(rotateMatrix(SHAPES.T)).toEqual([[0, 1, 0], [0, 1, 1], [0, 1, 0]])
  })

  it('поворот не змінює кількість клітинок', () => {
    for (const t of TYPES) expect(rotateMatrix(SHAPES[t]).flat().filter(Boolean)).toHaveLength(4)
  })
})

describe('collides', () => {
  const board = createBoard()
  it('вільне місце — без зіткнення', () => {
    expect(collides(board, SHAPES.O, 4, 0)).toBe(false)
  })
  it('стіни та дно', () => {
    expect(collides(board, SHAPES.O, -1, 0)).toBe(true)
    expect(collides(board, SHAPES.O, COLS - 1, 0)).toBe(true)
    expect(collides(board, SHAPES.O, 4, ROWS - 1)).toBe(true)
  })
  it('зайняті клітинки', () => {
    const b = merge(board, SHAPES.O, 4, 18, 'O')
    expect(collides(b, SHAPES.O, 4, 18)).toBe(true)
    expect(collides(b, SHAPES.O, 4, 16)).toBe(false)
  })
})

describe('merge та clearLines', () => {
  it('merge не змінює старе поле', () => {
    const board = createBoard()
    const next = merge(board, SHAPES.O, 0, 0, 'O')
    expect(board[0][0]).toBeNull()
    expect(next[0][0]).toBe('O')
  })

  it('заповнений ряд спалюється, решта опускається', () => {
    let board = createBoard()
    board[19] = Array(COLS).fill('I')
    board[18][3] = 'T'
    const r = clearLines(board)
    expect(r.cleared).toBe(1)
    expect(r.board).toHaveLength(ROWS)
    expect(r.board[19][3]).toBe('T')
    expect(r.board[0].every((c) => c === null)).toBe(true)
  })

  it('ряд із прогалиною не спалюється', () => {
    const board = createBoard()
    board[19] = Array(COLS).fill('I')
    board[19][5] = null
    expect(clearLines(board).cleared).toBe(0)
  })

  it('чотири ряди одночасно («тетріс»)', () => {
    const board = createBoard()
    for (let r = 16; r < 20; r++) board[r] = Array(COLS).fill('I')
    expect(clearLines(board).cleared).toBe(4)
  })
})

describe('tryRotate', () => {
  it('біля стіни фігура підштовхується, а не застряє', () => {
    // вертикальна I біля правої стіни
    const piece = { ...spawnPiece('I'), matrix: rotateMatrix(SHAPES.I), x: COLS - 3, y: 5 }
    const rotated = tryRotate(createBoard(), piece)
    expect(rotated).not.toBeNull()
    expect(collides(createBoard(), rotated.matrix, rotated.x, rotated.y)).toBe(false)
  })

  it('повертає null, якщо повернути нікуди', () => {
    const board = createBoard().map((row) => row.map(() => 'X'))
    expect(tryRotate(board, spawnPiece('T'))).toBeNull()
  })
})

describe('landingY', () => {
  it('порожній стакан — фігура падає на дно', () => {
    expect(landingY(createBoard(), spawnPiece('O'))).toBe(ROWS - 2)
  })
})

describe('очки, рівні, швидкість', () => {
  it('таблиця очок множиться на рівень', () => {
    expect(lineScore(1, 1)).toBe(100)
    expect(lineScore(4, 1)).toBe(800)
    expect(lineScore(2, 3)).toBe(900)
    expect(lineScore(0, 5)).toBe(0)
  })
  it('рівень зростає кожні 10 ліній', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(9)).toBe(1)
    expect(levelFor(10)).toBe(2)
    expect(levelFor(25)).toBe(3)
  })
  it('вищий рівень — швидше падіння, але не швидше за мінімум', () => {
    expect(gravityInterval(5)).toBeLessThan(gravityInterval(1))
    expect(gravityInterval(99)).toBeGreaterThanOrEqual(0.05)
  })
})

describe('shuffle', () => {
  it('зберігає всі елементи рівно по одному разу', () => {
    expect([...shuffle(TYPES)].sort()).toEqual([...TYPES].sort())
  })
  it('не змінює вхідний масив', () => {
    const src = [1, 2, 3, 4]
    shuffle(src)
    expect(src).toEqual([1, 2, 3, 4])
  })
})

describe('spawnPiece', () => {
  it('з’являється по центру зверху', () => {
    const p = spawnPiece('T')
    expect(p.y).toBe(0)
    expect(p.x).toBe(3)
  })
})
