import GameObject from "./GameObject.js";

export default class Nanofabricator extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Silver/gray base rectangle
    ctx.fillStyle = "#ccc";
    ctx.fillRect(x, y, size, size);

    // Grid pattern
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + (i * size) / 4, y);
      ctx.lineTo(x + (i * size) / 4, y + size);
      ctx.moveTo(x, y + (i * size) / 4);
      ctx.lineTo(x + size, y + (i * size) / 4);
      ctx.stroke();
    }

    // Blue fabrication chamber in center
    ctx.fillStyle = "#00f";
    ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
  }
}
