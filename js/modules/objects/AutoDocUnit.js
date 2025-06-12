import GameObject from "./GameObject.js";

export default class AutoDocUnit extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Main body
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Medical cross
    ctx.fillStyle = "#f00";
    ctx.fillRect(x + size / 3, y + size / 4, size / 3, size / 2);
    ctx.fillRect(x + size / 4, y + size / 3, size / 2, size / 3);

    // Display panel
    ctx.fillStyle = "#00f";
    ctx.fillRect(x + size / 4, y + size / 8, size / 2, size / 8);
  }
}
