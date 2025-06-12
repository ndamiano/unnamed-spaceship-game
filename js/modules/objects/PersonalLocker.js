import GameObject from "./GameObject.js";

export default class PersonalLocker extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Gray locker with black border
    ctx.fillStyle = "#ccc";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Door handle
    ctx.fillStyle = "#555";
    ctx.fillRect(x + size * 0.8, y + size / 2 - size / 8, size / 5, size / 4);
  }
}
