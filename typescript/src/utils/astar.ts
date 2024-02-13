import allDirections, { cardinals } from './directions.js'
import { getWalls } from './walls.js'

// TODO: add rotation as a cost parameter to the A* algorithm
export class Node {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Node | null
  child: Node | null

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.g = 0
    this.h = 0
    this.f = 0
    this.parent = null
    this.child = null
  }
}

export class AStar {
  grid: number[][]
  openList: Node[]
  closedList: Node[]
  startNode: Node
  endNode: Node

  constructor(grid: number[][]) {
    this.grid = grid
    this.openList = []
    this.closedList = []
    this.startNode = new Node(0, 0)
    this.endNode = new Node(0, 0)
  }

  findPath(start: [number, number], end: [number, number]): Node[] | null {
    this.startNode = new Node(start[0], start[1])
    this.endNode = new Node(end[0], end[1])

    this.openList = []
    this.closedList = []

    this.openList.push(this.startNode)

    while (this.openList.length > 0) {
      let currentNode = this.openList[0]
      let currentIndex = 0

      for (let i = 0; i < this.openList.length; i++) {
        if (this.openList[i].f < currentNode.f) {
          currentNode = this.openList[i]
          currentIndex = i
        }
      }

      this.openList.splice(currentIndex, 1)
      this.closedList.push(currentNode)

      if (currentNode.x === this.endNode.x && currentNode.y === this.endNode.y) {
        let path: Node[] = []
        let current = currentNode
        while (current !== null) {
          path.unshift(current)
          current = current.parent
        }
        return path
      }

      let children: Node[] = []

      for (const rot in cardinals) {
        // Get direction with rotation
        let [dx, dy] = cardinals[rot]

        // TODO: implement checks for diagonal movement

        let x = currentNode.x + dx
        let y = currentNode.y + dy

        // If out of bounds
        if (x < 0 || x >= this.grid[0].length || y < 0 || y >= this.grid.length) continue

        // Not path
        if (this.grid[y][x] === null) continue

        // Don't pass through the goal
        if (this.grid[currentNode.y][currentNode.x] === 17) continue

        // If wall in the rotation
        if (getWalls(this.grid[currentNode.y][currentNode.x])[rot]) continue

        let newNode = new Node(x, y)
        newNode.g = currentNode.g + 1
        newNode.h = Math.abs(x - this.endNode.x) + Math.abs(y - this.endNode.y)
        newNode.f = newNode.g + newNode.h
        newNode.parent = currentNode
        children.push(newNode)
      }

      for (const child of children) {
        if (this.closedList.find((node) => node.x === child.x && node.y === child.y)) {
          continue
        }

        let existingNode = this.openList.find((node) => node.x === child.x && node.y === child.y)
        if (existingNode && child.g >= existingNode.g) {
          continue
        }

        this.openList.push(child)
      }
    }

    return null
  }
}
