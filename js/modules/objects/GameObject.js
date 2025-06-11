import { Tile } from "../Tile.js";

export default class GameObject extends Tile {
  constructor(x, y) {
    super(x, y, false);
  }

  render(ctx, x, y, size) {
    // Default object rendering - red square as fallback
    ctx.fillStyle = "#f00";
    ctx.fillRect(x, y, size, size);
  }
}
