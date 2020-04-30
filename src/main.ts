import { BrickGrid } from './BrickGrid'
import { Direction, Rect } from './common'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
if (!ctx) {
  throw new Error('Could not initialize canvas 2D context')
}

const width = 600
const height = 600

canvas.width = width
canvas.height = height

// Clear canvas to black
ctx.fillStyle = 'rgba(0,0,0,1)'
ctx.fillRect(0, 0, width, height)

const keyDown = new Set()
document.addEventListener('focusout', () => {
  keyDown.clear()
})
document.addEventListener('keydown', (event) => {
  keyDown.add(event.which)
})
document.addEventListener('keyup', (event) => {
  keyDown.delete(event.which)
})

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min
  if (v > max) return max
  return v
}

let xSize = 120
let ySize = 8
let paddleX = width / 2 - xSize / 2
let paddleY = height - ySize - 20

let ballX = 300
let ballY = 300
let prevBallX = ballX
let prevBallY = ballY
let ballRadius = 12
const startingBallVX = 0
let ballVX = startingBallVX
const maxBallSpeed = 9

let paddleVelocity = 0
let paddleAcceleration = 0.2

const calcVY = () => Math.sqrt(Math.pow(maxBallSpeed, 2) - Math.pow(ballVX, 2))
const startingBallVY = calcVY()
let ballVY = startingBallVY

let grid = new BrickGrid(10, 10)

const overlap = (a: [number, number], b: [number, number]): boolean => {
  return a[1] > b[0] && b[1] > a[0]
}

const ballCollision = (rect: Rect): Direction[] => {
  const ballRect: Rect = {
    x: ballX - ballRadius,
    y: ballY - ballRadius,
    w: ballRadius * 2,
    h: ballRadius * 2,
  }

  const overlapX = overlap(
    [rect.x, rect.x + rect.w],
    [ballRect.x, ballRect.x + ballRect.w],
  )
  const overlapY = overlap(
    [rect.y, rect.y + rect.h],
    [ballRect.y, ballRect.y + ballRect.h],
  )
  if (!overlapX || !overlapY) {
    return []
  }

  const prevRect: Rect = {
    x: prevBallX - ballRadius,
    y: prevBallY - ballRadius,
    w: ballRadius * 2,
    h: ballRadius * 2,
  }

  const edges = []

  const prevOverlapX = overlap(
    [rect.x, rect.x + rect.w],
    [prevRect.x, prevRect.x + prevRect.w],
  )
  if (!prevOverlapX) {
    edges.push(ballVX > 0 ? Direction.W : Direction.E)
  }

  const prevOverlapY = overlap(
    [rect.y, rect.y + rect.h],
    [prevRect.y, prevRect.y + prevRect.h],
  )
  if (!prevOverlapY) {
    edges.push(ballVY > 0 ? Direction.N : Direction.S)
  }

  return edges
}

function gameLoop() {
  requestAnimationFrame(gameLoop)

  // Clear canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)

  // Simulate paddle
  if (keyDown.has(keyMap.right)) {
    if (paddleVelocity < 0) {
      paddleVelocity += paddleAcceleration * 1.5
    }
    paddleVelocity += paddleAcceleration
  } else if (keyDown.has(keyMap.left)) {
    if (paddleVelocity > 0) {
      paddleVelocity -= paddleAcceleration * 1.5
    }
    paddleVelocity -= paddleAcceleration
  } else {
    paddleVelocity += -0.075 * Math.sign(paddleVelocity)
  }
  paddleX = paddleX + paddleVelocity

  paddleX = clamp(paddleX, 0, width - xSize)
  if (paddleX === 0 || paddleX === width - xSize) {
    paddleVelocity = -paddleVelocity * 0.35
  }
  ctx.fillStyle = 'green'
  ctx.fillRect(paddleX, paddleY, xSize, ySize)

  // Simulate ball
  ballX = ballX + ballVX
  ballY = ballY + ballVY

  const paddleRect: Rect = {
    x: paddleX,
    y: paddleY,
    w: xSize,
    h: ySize,
  }
  let edges = ballCollision(paddleRect)
  if (edges.includes(Direction.N)) {
    ballVX += paddleVelocity * 0.25
    ballVX = Math.sign(ballVX) * Math.min(maxBallSpeed * 0.8, Math.abs(ballVX))

    ballVY = -Math.sqrt(Math.pow(maxBallSpeed, 2) - Math.pow(ballVX, 2))
  }

  let didXCollide = false
  let didYCollide = false
  const collisions = []
  grid.bricks.forEach((row) => {
    row.forEach((b) => {
      if (b.dead) return
      ballCollision(b.aabb()).forEach((edge) =>
        collisions.push({ brick: b, edge }),
      )
    })
  })

  collisions
    .filter(({ brick, edge }) => {
      let n = grid.neighbor(brick, edge)
      return n === null || n.dead
    })
    .forEach(({ brick, edge }) => {
      switch (edge) {
        case Direction.N:
        case Direction.S:
          didYCollide = true
          break
        case Direction.W:
        case Direction.E:
          didXCollide = true
          break
      }
      brick.dead = true
    })

  if (didYCollide) ballVY *= -1
  if (didXCollide) ballVX *= -1

  ballX = clamp(ballX, 0 + ballRadius, width - ballRadius)
  ballY = clamp(ballY, 0 + ballRadius, height - ballRadius)

  if (ballX <= 0 + ballRadius || width - ballRadius <= ballX) {
    ballVX = -ballVX // bounce off wall
  }
  if (ballY <= 0 + ballRadius || height - ballRadius <= ballY) {
    ballVY = -ballVY // bounce off ceiling
  }

  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(ballX, ballY, ballRadius, 0, 360)
  ctx.closePath()
  ctx.fill()

  // Draw bricks
  grid.render(ctx)

  // Reset upon death
  if (ballY + ballRadius >= height) {
    grid = new BrickGrid(10, 10)
    paddleX = width / 2 - xSize / 2
    paddleVelocity = 0
    ballX = 300
    ballY = 300
    ballVX = startingBallVX
    ballVY = startingBallVY
  }
}

gameLoop()
