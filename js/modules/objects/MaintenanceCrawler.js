import GameObject from "./GameObject.js";

export default class MaintenanceCrawler extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Yellow body
    ctx.fillStyle = "#ff0";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Black tracks/wheels
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y + size / 3, size, size / 6);
    ctx.fillRect(x, y + size / 2, size, size / 6);

    // Black sensor head
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 4, size / 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
