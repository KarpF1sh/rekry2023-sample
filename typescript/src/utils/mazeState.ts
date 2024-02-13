import allDirections, { cardinals, getDirectionArrow } from './directions.js'
import { Walls, getWallType } from './walls.js'
import { Location, Rotation, WallTypes } from '../types.js'
import { Node } from './astar.js'
import { get } from 'http'

export abstract class MazeState {
  public static rotation: number
  public static walls: Walls
  public static x: number
  public static y: number

  private static start: Location
  private static end: Location

  public static mazeMap: number[][] = []
  public static path: Node[] = []
  public static undiscovered: number[][] = []

  public static init(rows: number, cols: number, start: Location, end: Location): void {
    // Set start and end
    this.start = start
    this.end = end

    // Fill map with nulls
    for (let i = 0; i < rows; i++) {
      let row: number[] = []
      for (let j = 0; j < cols; j++) {
        row.push(null)
      }
      this.mazeMap.push(row)
    }

    // Save start and end in map
    this.mazeMap[end.y][end.x] = 17
  }

  public static getStart(): [number, number] {
    return [this.start.x, this.start.y]
  }

  public static getEnd(): [number, number] {
    return [this.end.x, this.end.y]
  }

  public static setMazeMapWalls(square: number): void {
    this.mazeMap[this.y][this.x] = square
  }

  public static setUndiscovered(): void {
    // Remove current square from undiscovered targets
    this.undiscovered = this.undiscovered.filter(([x, y]) => !(x === this.x && y === this.y))

    // Loop through all neighbours
    for (const rot in cardinals) {
      // Get direction with rotation
      let [dx, dy] = cardinals[rot]
      let [nx, ny] = [this.x + dx, this.y + dy]

      // If there is no wall next to us mark the square as undiscovered and store it's coordinates
      if (!this.walls[rot] && MazeState.mazeMap[ny][nx] === null) {
        MazeState.mazeMap[ny][nx] = -1
        MazeState.undiscovered.push([nx, ny])
      }
    }
  }

  // returns null if not adjacent or no direction, else returns the direction
  public static getDirection(newX: number, newY: number): number | null {
    // Loop through all neighbours
    for (const rot in allDirections) {
      // Get direction with rotation
      let [dx, dy] = allDirections[rot]

      if (newX - this.x === dx && newY - this.y == dy) {
        return parseInt(rot)
      }
    }
    return null
  }

  public static getFreeNeighbours(): number[][] {
    // List of movable squares
    let potMoves: number[][] = []

    // Loop through angles
    for (const rot in cardinals) {
      // Get direction with rotation
      let [dx, dy] = allDirections[rot]
      let [newX, newY] = [this.x + dx, this.y + dy]

      if (!this.walls[rot]) {
        if (this.mazeMap[newY][newX] === null) continue // Unmarked square
        if (newY === this.end.y && newX === this.end.x) continue // Goal node
        if (this.mazeMap[newY][newX] !== -1) continue // Already visited

        // Add open squares coorinates to list
        potMoves.push([newX, newY])
      }
    }

    return potMoves
  }

  public static displayMaze(): void {
    let buffer = ''
    for (var i = 0; i < this.mazeMap.length; i++) {
      for (var j = 0; j < this.mazeMap[i].length; j++) {
        let char = ''

        // Get path character
        char = getWallType(this.mazeMap[i][j] as WallTypes)
        // Add Start
        if (i === this.start.y && j === this.start.x) {
          char = '⌂'
        }
        // Add End
        if (i === this.end.y && j === this.end.x) {
          char = '⚑'
        }
        // Add Undiscovered
        if (this.mazeMap[i][j] === -1) {
          char = '*'
        }
        // Add Player
        if (i === this.y && j === this.x) {
          char = getDirectionArrow(this.rotation as Rotation)
        }

        buffer += char
      }
      buffer += '\n'
    }
    console.log(buffer)
  }
}
