import type { Rotation, Direction } from '../types.js'

export type DirectionMap = Partial<{
  [key in Rotation]: Direction
}>

export const cardinals: DirectionMap = {
  0: [0, -1],
  90: [1, 0],
  180: [0, 1],
  270: [-1, 0],
}

export const diagonals: DirectionMap = {
  45: [1, -1],
  135: [1, 1],
  225: [-1, 1],
  315: [-1, -1],
}

export const allDirections: DirectionMap = {
  ...cardinals,
  ...diagonals,
}

export const getDirectionArrow = (rotate: Rotation): string => {
  switch (rotate) {
    case 0:
      return '⇑'
    case 45:
      return '⇗'
    case 90:
      return '⇒'
    case 135:
      return '⇘'
    case 180:
      return '⇓'
    case 225:
      return '⇙'
    case 270:
      return '⇐'
    case 315:
      return '⇖'
  }
}

export default allDirections
