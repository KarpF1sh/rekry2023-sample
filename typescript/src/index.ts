import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Message, NoWayOutState, Player, Rotation } from './types.js'
import { message } from './utils/message.js'
import { Walls, getWalls } from './utils/walls.js'
import { platform } from 'os'
import { Console } from 'console'
import { start } from 'repl'
import { only } from 'node:test'
import { cardinals, allDirections, diagonals } from './utils/directions.js'
import { get } from 'http'
import { AStar } from './utils/astar.js'
import { MazeState } from './utils/mazeState.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'

const generateAction = (gameState: NoWayOutState): Action => {
  const { player, square } = gameState
  const { rotation } = player

  const walls = getWalls(square)

  // Store current player position and rotation
  MazeState.x = player.position.x;
  MazeState.y = player.position.y;
  MazeState.rotation = rotation;
  MazeState.walls = walls;

  // Store current wall state
  MazeState.setMazeMapWalls(square);

  // Remove current square from undiscovered targets
  MazeState.setUndiscovered();
  //MazeState.undiscovered = MazeState.undiscovered.filter(([x, y]) => !(x === mapX && y === mapY));
  // Print map
  MazeState.displayMaze();

  // If we have a A* path, follow it
  if (MazeState.path.length > 0) {

    // Get second node in path, the first one starts at the current position
    let nextNode = MazeState.path[1];

    // TODO: This is a bit hacky, but it works for now /
    // Implement this in the astar class instead
    let diagonalNode = MazeState.path[2];

    if ( nextNode ) {
      // Get direction towards next node
      let direction = MazeState.getDirection(nextNode.x, nextNode.y);

      if (diagonalNode && (MazeState.x - diagonalNode.x !== 0 && MazeState.y - diagonalNode.y !== 0)) {
        // Get direction towards next node
        direction = MazeState.getDirection(diagonalNode.x, diagonalNode.y);
      }

      // Test and set rotation
      if (rotation !== direction && direction !== null) {
        return {
          action: 'rotate',
          rotation: direction as Rotation
        }
      }

      // If we are moving diagonally, remove 2 steps from the path
      if (direction in diagonals) {
        MazeState.path.shift();
      }

      // If we already point in the right direction remove current step from path and move
      MazeState.path.shift();

      return {
        action: 'move'
      }

    } else {
      MazeState.path = [];
    }
  }

  // If there are no more undiscovered squares, reset and find the path to the end
  if (MazeState.mazeMap.every(row => row.every(cell => cell !== -1))) {

    // Get astar path to the end
    MazeState.path = new AStar(MazeState.mazeMap).findPath(MazeState.getStart(), MazeState.getEnd());

    // If path is found reset the game
    if (MazeState.path) {
      //console.log("Path found:");
      //console.log(MazeState.path);
      // Do the reset
      return {
        action: 'reset'
      }
    } else {
      throw new Error('Path not found');
    }
  }

  // Get neighboring unvisited squares
  let neighbors = MazeState.getFreeNeighbours();

  // If there are unvisited neighbors, move to the first one we found
  if (neighbors.length > 0) {
    let [nextX, nextY] = neighbors[0];
    let direction = MazeState.getDirection(nextX, nextY);

    // Test and set rotation
    if (rotation !== direction) {
      return {
        action: 'rotate',
        rotation: direction as Rotation
      }
    }
  // If there are no neighbouring cells to visit, path find to the next undiscovered cell
  } else {
    // Get last element in undiscovered, and make it the target, also remove it from the list
    let [nextX, nextY] = MazeState.undiscovered.pop();

    // Get astar path from current position to target
    // This way we get the fastest route to the last undiscovered square
    MazeState.path = new AStar(MazeState.mazeMap).findPath([MazeState.x, MazeState.y], [nextX, nextY]);

    // Get direction towards next node
    let direction = MazeState.getDirection(MazeState.path[1].x, MazeState.path[1].y);

    // Test for possible diagonal move
    // TODO: This is a bit hacky, but it works for now /
    // Implement this in the astar class instead
    let diagonalNode = MazeState.path[2];

    // if the first move is diagonal, pre allign the rotation
    if (diagonalNode && (MazeState.x - diagonalNode.x !== 0 && MazeState.y - diagonalNode.y !== 0)) {
      // Get direction towards next node
      direction = MazeState.getDirection(diagonalNode.x, diagonalNode.y);
    }

    // Test and set rotation
    if (rotation !== direction) {
      return {
        action: 'rotate',
        rotation: direction as Rotation
      }
    }

    // If we already point in the right direction we need to move,
    // Remove the first move from the path
    MazeState.path.shift();
  }

  // If we didn't need to rotate we can move
  return {
    action: 'move'
  }
}

const createGame = async (levelId: string, token: string) => {
  const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })

  if (!res.ok) {
    console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`)
    return null
  }

  return res.json() as any as GameInstance // Can be made safer
}

const main = async () => {
  const token = process.env['PLAYER_TOKEN'] ?? ''
  const levelId = process.env['LEVEL_ID'] ?? ''

  const game = await createGame(levelId, token)
  if (!game) return

  const url = `https://${frontend_base}/?id=${game.entityId}`
  console.log(`Game at ${url}`)
  //await open(url) // Remove this if you don't want to open the game in browser

  await new Promise((f) => setTimeout(f, 2000))
  const ws = new WebSocket(`wss://${backend_base}/${token}/`)

  ws.addEventListener('open', () => {
    ws.send(message('sub-game', { id: game.entityId }))
  })

  ws.addEventListener('message', ({ data }) => {
    //console.log('Received message:', data.toString())

    const [action, payload] = JSON.parse(data.toString()) as Message<'game-instance'>

    if (action !== 'game-instance') {
      console.log([action, payload])
      return
    }

    // New game tick arrived!
    const gameState = JSON.parse(payload['gameState']) as NoWayOutState

    // If maze is not initialized, initialize it
    if ( MazeState.mazeMap.length === 0) {
      MazeState.init(gameState.rows, gameState.columns, gameState.start, gameState.target);
    }

    var command = generateAction(gameState);

    setTimeout(() => {
      ws.send(message('run-command', { gameId: game.entityId, payload: command }))
    }, 100)
  });

  // Handle connection close
  ws.addEventListener('close', (event) => {
    console.log('WebSocket connection closed with code', event.code);
  });
}

await main()