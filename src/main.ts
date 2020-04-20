const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Could not initialize canvas 2D context');
}

const width = 600
const height = 600
canvas.width = width;
canvas.height = height;

// Clear canvas to black
ctx.fillStyle = 'rgba(0,0,0,1)'
ctx.fillRect(0, 0, 600, 600)

const keyDown = new Set();
document.addEventListener('focusout', () => {
  keyDown.clear();
});
document.addEventListener('keydown', (event) => {
  keyDown.add(event.which);
});
document.addEventListener('keyup', (event) => {
  keyDown.delete(event.which);
});

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
};

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

let xSize = 120;
let ySize = 8;
let paddleX = width / 2 - xSize / 2;
let paddleY = height - ySize - 20;

let ballX = 300
let ballY = 300
let prevBallX = ballX
let prevBallY = ballY
let ballRadius = 12
let vx = 7;
let vy = 4;

let brickW = 80
let brickH = 30
let bricks = []
for(let i = 0; i < 3; i++) {
  let xPos = 0
  while(xPos + brickW < width) {
    bricks.push([xPos, brickH * i])
    xPos = xPos + brickW
  }    
}

const renderBrick = (x,y) => {
  ctx.fillStyle = 'red'
  ctx.strokeStyle = 'yellow'
  ctx.fillRect(x, y, brickW, brickH)
  ctx.strokeRect(x, y, brickW, brickH)
}
const overlap = (a: [number, number], b: [number, number]) : boolean => {
  return a[1] > b[0] && b[1] > a[0] 
}
const ballCollision = (rect: Rect): [boolean, boolean] => {
  const ballRect : Rect = {
    x: ballX - ballRadius,
    y: ballY - ballRadius,
    w: ballRadius * 2,
    h: ballRadius * 2 
  }

  const overlapX = overlap([rect.x, rect.x + rect.w], [ballRect.x, ballRect.x + ballRect.w])
  const overlapY = overlap([rect.y, rect.y + rect.h], [ballRect.y, ballRect.y + ballRect.h])
  if (!overlapX || !overlapY) { return [false, false]}

  const prevRect : Rect = {
    x: prevBallX - ballRadius,
    y: prevBallY - ballRadius,
    w: ballRadius * 2,
    h: ballRadius * 2 
  }

  const prevOverlapX = overlap([rect.x, rect.x + rect.w], [prevRect.x, prevRect.x + prevRect.w])
  const prevOverlapY = overlap([rect.y, rect.y + rect.h], [prevRect.y, prevRect.y + prevRect.h])

  return [!prevOverlapX, !prevOverlapY]
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  // Clear canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)  

  // Simulate paddle
  const paddleSpeed = 7;
  if (keyDown.has(keyMap.right)) {
    paddleX = paddleX + paddleSpeed;
  } else if (keyDown.has(keyMap.left)) {
    paddleX = paddleX - paddleSpeed;
  }

  paddleX = clamp(paddleX, 0, width - xSize);
  ctx.fillStyle = 'green'
  ctx.fillRect(paddleX, paddleY, xSize, ySize)
  
  // Simulate ball
  let prevBallX = ballX
  let prevBallY = ballY

  ballX = ballX + vx
  ballY = ballY + vy

  const paddleRect :Rect = {
    x: paddleX,
    y: paddleY,
    w: xSize,
    h: ySize,
  }
  let [xHit, yHit] = ballCollision(paddleRect)
  if (yHit) {
    vy = -vy // bounce off paddle
  }

  const toDelete = []
  let didXCollide = false
  let didYCollide = false
  bricks.forEach((b, i) => {
    const brickRect = {
      x: b[0],
      y: b[1],
      w: brickW,
      h: brickH,
    }
    let [xHit, yHit] = ballCollision(brickRect)
    didXCollide = didXCollide || xHit
    didYCollide = didYCollide || yHit
    if (xHit || yHit) {
      toDelete.push(i)
    }
  })
  toDelete.forEach(i => delete bricks[i])

  if (didXCollide) {
    vx = -vx
  }
  if (didYCollide) {
    vy = -vy
  }

  ballX = clamp(ballX, 0 + ballRadius, width - ballRadius)
  ballY = clamp(ballY, 0 + ballRadius, height - ballRadius)

  if (ballX <= (0 + ballRadius) || (width - ballRadius) <= ballX) {
    vx = -vx // bounce off wall
  }
  if (ballY <= (0 + ballRadius) || (height - ballRadius) <= ballY) {
    vy = -vy // bounce off ceiling
  }
 
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(ballX, ballY, ballRadius, 0, 360)
  ctx.closePath()
  ctx.fill()

  // Draw bricks
  bricks.forEach(b => {
    renderBrick(b[0], b[1])
  })
}

gameLoop();

