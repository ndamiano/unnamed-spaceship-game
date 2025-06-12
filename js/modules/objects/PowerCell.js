import GameObject from "./GameObject.js";

export default class PowerCell extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Yellow rectangle with black border
    ctx.fillStyle = "#ff0";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Plus sign in center
    ctx.fillStyle = "#000";
    ctx.fillRect(x + size / 2 - size / 8, y + size / 4, size / 4, size / 2);
    ctx.fillRect(x + size / 4, y + size / 2 - size / 8, size / 2, size / 4);
  }
}
