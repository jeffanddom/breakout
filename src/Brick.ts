import { Rect } from './common'

const brickWidth = 60
const brickHeight = 20

export class Brick {
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
