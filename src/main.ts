const width = 600
const height = 600
const brickWidth = 60
const brickHeight = 20

enum Direction {
  N,
  S,
  W,
  E,
}

class Brick {
  i: number
  j: number
  dead: boolean

  constructor(i: number, j: number) {
    this.i = i
    this.j = j
    this.dead = false
  }

  x(): number {
    return this.j * brickWidth
  }

  y(): number {
    return this.i * brickHeight
  }

  aabb(): Rect {
    return { x: this.x(), y: this.y(), w: brickWidth, h: brickHeight }
  }

  extrema() {
    return [
      [this.x(), this.y()],
      [this.x() + brickWidth, this.y() + brickHeight],
    ]
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.dead) return

    ctx.fillStyle = 'red'
    ctx.strokeStyle = 'yellow'
    ctx.fillRect(this.x(), this.y(), brickWidth, brickHeight)
    ctx.strokeRect(this.x(), this.y(), brickWidth, brickHeight)
  }
}

class Playfield {
  rows: number
  cols: number
  bricks: Brick[][]

  constructor(rows: number, cols: number) {
    this.rows = rows
    this.cols = cols
    this.bricks = []

    for (let i = 0; i < rows; i++) {
      let row = []
      this.bricks.push(row)
      for (let j = 0; j < cols; j++) {
        row.push(new Brick(i, j))
      }
    }
  }

  neighbor(b: Brick, d: Direction): Brick | null {
    let i = b.i
    let j = b.j
    switch (d) {
      case Direction.N:
        i -= 1
        break
      case Direction.S:
        i += 1
        break
      case Direction.W:
        j -= 1
        break
      case Direction.E:
        j += 1
        break
    }

    if (i < 0 || this.rows <= i) return null
    if (j < 0 || this.cols <= j) return null
    return this.bricks[i][j]
  }

  render(ctx: CanvasRenderingContext2D) {
    this.bricks.forEach((row) => {
      row.forEach((b) => b.render(ctx))
    })
  }
}

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')
if (!ctx) {
  throw new Error('Could not initialize canvas 2D context')
}

canvas.width = width
canvas.height = height

// Clear canvas to black
ctx.fillStyle = 'rgba(0,0,0,1)'
ctx.fillRect(0, 0, 600, 600)

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

interface Rect {
  x: number
  y: number
  w: number
  h: number
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
let ballVX = 7
let ballVY = 4

let brickW = 80
let brickH = 30
let playfield = new Playfield(10, 10)

playfield.bricks[9][5].dead = true

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

  let nw = [rect.x, rect.y]
  let se = [rect.x + rect.width, rect.y + rect.height]

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
  const paddleSpeed = 7
  if (keyDown.has(keyMap.right)) {
    paddleX = paddleX + paddleSpeed
  } else if (keyDown.has(keyMap.left)) {
    paddleX = paddleX - paddleSpeed
  }

  paddleX = clamp(paddleX, 0, width - xSize)
  ctx.fillStyle = 'green'
  ctx.fillRect(paddleX, paddleY, xSize, ySize)

  // Simulate ball
  let prevBallX = ballX
  let prevBallY = ballY

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
    ballVY = -ballVY // bounce off paddle
  }

  const toDelete = []
  let didXCollide = false
  let didYCollide = false
  const collisions = []
  playfield.bricks.forEach((row) => {
    row.forEach((b) => {
      if (b.dead) return
      ballCollision(b.aabb()).forEach((edge) =>
        collisions.push({ brick: b, edge }),
      )
    })
  })

  if (collisions.length > 0) console.log(collisions)

  collisions
    .filter(({ brick, edge }) => {
      let n = playfield.neighbor(brick, edge)
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
  playfield.render(ctx)
}

gameLoop()
