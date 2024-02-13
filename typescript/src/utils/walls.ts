import type { Rotation, WallTypes } from '../types.js'

export type Walls = Partial<{
  [key in Rotation]: boolean
}>

/**
 * Square is a 4 bit number, each bit represents a wall
 * @param square
 * @returns Walls around the square
 */
export const getWalls = (square: number): Walls => {
  const masks = [0b1000, 0b0100, 0b0010, 0b0001] as const

  return {
    0: (square & masks[0]) !== 0,
    90: (square & masks[1]) !== 0,
    180: (square & masks[2]) !== 0,
    270: (square & masks[3]) !== 0,
  }
}

export const getWallType = (square: WallTypes): string => {
  switch (square) {
    case 0:
      return '┼' // No walls
    case 1:
      return '├' // West wall
    case 2:
      return '┴' // South wall
    case 4:
      return '┤' // East wall
    case 8:
      return '┬' // North wall
    case 3:
      return '└'
    case 5:
      return '│'
    case 6:
      return '┘'
    case 9:
      return '┌'
    case 10:
      return '─'
    case 12:
      return '┐'
    case 7:
      return '╵'
    case 11:
      return '╶'
    case 13:
      return '╷'
    case 14:
      return '╴'
    case 15:
      return '·'
    case null:
      return ' '
    default:
      return ' '
  }
}
