import { Tile } from "../Tile.js";

export class Floor extends Tile {
  constructor(x, y) {
    super(x, y, true); // Floors are passable
  }
  render(ctx, x, y, size) {
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y, size, size);

    // Add grid pattern
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }
}
