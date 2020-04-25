import { Brick } from './Brick'
import { Direction } from './common'

export class BrickGrid {
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
