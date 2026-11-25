import { describe, expect, it } from 'vitest'
import {
  COLS, DOOR_OUT, HOUSE, MAZE, PAC_START, ROWS, TUNNEL_ROW,
  bfsDistances, canEnterTile, chaseTarget, tileAt,
} from './PacmanEngine.js'

describe('лабіринт', () => {
  it('має розмір 21×15, усі рядки однакової довжини', () => {
    expect(MAZE).toHaveLength(ROWS)
    for (const row of MAZE) expect(row).toHaveLength(COLS)
  })

  it('дзеркально симетричний', () => {
    for (const row of MAZE) expect(row).toBe([...row].reverse().join(''))
  })

  it('оточений стінами, окрім тунелю', () => {
    for (let x = 0; x < COLS; x++) {
      expect(MAZE[0][x]).toBe('#')
      expect(MAZE[ROWS - 1][x]).toBe('#')
    }
    for (let y = 0; y < ROWS; y++) {
      if (y === TUNNEL_ROW) continue
      expect(MAZE[y][0]).toBe('#')
      expect(MAZE[y][COLS - 1]).toBe('#')
    }
    expect(MAZE[TUNNEL_ROW][0]).not.toBe('#')
    expect(MAZE[TUNNEL_ROW][COLS - 1]).not.toBe('#')
  })

  it('має чотири енерджайзери та одні двері', () => {
    expect(MAZE.join('').split('o')).toHaveLength(5)
    expect(MAZE.join('').split('-')).toHaveLength(2)
  })

  it('старт Pac-Man і привидів стоять на вільних клітинках', () => {
    expect(canEnterTile(MAZE, PAC_START.x, PAC_START.y)).toBe(true)
    expect(canEnterTile(MAZE, DOOR_OUT.x, DOOR_OUT.y)).toBe(true)
    expect(canEnterTile(MAZE, HOUSE.x, HOUSE.y)).toBe(true)
  })

  it('двері пропускають лише привидів', () => {
    expect(canEnterTile(MAZE, 10, 6, false)).toBe(false)
    expect(canEnterTile(MAZE, 10, 6, true)).toBe(true)
  })

  it('тунель веде за межі лабіринту лише у своєму рядку', () => {
    expect(tileAt(MAZE, -1, TUNNEL_ROW)).toBe(' ')
    expect(tileAt(MAZE, COLS, TUNNEL_ROW)).toBe(' ')
    expect(tileAt(MAZE, -1, 3)).toBe('#')
  })
})

describe('bfsDistances', () => {
  const dist = bfsDistances(MAZE, PAC_START.x, PAC_START.y, false)

  it('кожна крапка й енерджайзер досяжні для Pac-Man', () => {
    MAZE.forEach((row, y) =>
      [...row].forEach((t, x) => {
        if (t === '.' || t === 'o') expect(dist[y][x], `(${x},${y})`).not.toBe(Infinity)
      }),
    )
  })

  it('до самої себе відстань 0, до сусідньої — 1', () => {
    expect(dist[PAC_START.y][PAC_START.x]).toBe(0)
    expect(dist[PAC_START.y][PAC_START.x - 1]).toBe(1)
  })

  it('тунель скорочує шлях: краї рядка тунелю сусідні', () => {
    const d = bfsDistances(MAZE, 0, TUNNEL_ROW)
    expect(d[TUNNEL_ROW][COLS - 1]).toBe(1)
  })

  it('з дверима привиди дістаються до будиночка, без дверей — ні', () => {
    expect(bfsDistances(MAZE, HOUSE.x, HOUSE.y, true)[DOOR_OUT.y][DOOR_OUT.x]).toBe(2)
    expect(bfsDistances(MAZE, HOUSE.x, HOUSE.y, false)[DOOR_OUT.y][DOOR_OUT.x]).toBe(Infinity)
  })
})

describe('chaseTarget', () => {
  const pac = { x: 10, y: 11, facing: 'left' }
  const blinky = { x: 4, y: 11 }

  it('Blinky женеться прямо за Pac-Man', () => {
    expect(chaseTarget('blinky', blinky, pac, blinky, { x: 19, y: 0 })).toEqual({ x: 10, y: 11 })
  })
  it('Pinky цілиться на 4 клітинки попереду', () => {
    expect(chaseTarget('pinky', blinky, pac, blinky, { x: 2, y: 0 })).toEqual({ x: 6, y: 11 })
  })
  it('Inky відображає позицію Blinky відносно точки попереду Pac-Man', () => {
    // точка попереду: (8, 11); Blinky (4, 11) -> (12, 11)
    expect(chaseTarget('inky', blinky, pac, blinky, { x: 19, y: 14 })).toEqual({ x: 12, y: 11 })
  })
  it('Clyde далеко — переслідує, поруч — тікає в кут', () => {
    const corner = { x: 1, y: 14 }
    expect(chaseTarget('clyde', { x: 0, y: 0 }, pac, blinky, corner)).toEqual({ x: 10, y: 11 })
    expect(chaseTarget('clyde', { x: 9, y: 11 }, pac, blinky, corner)).toEqual(corner)
  })
})
