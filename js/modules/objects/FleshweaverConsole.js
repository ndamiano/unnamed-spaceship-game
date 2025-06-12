import GameObject from "./GameObject.js";

export default class FleshweaverConsole extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Console base
    ctx.fillStyle = "#a33";
    ctx.fillRect(x + size / 4, y + size / 3, size / 2, (size * 2) / 3);
    ctx.strokeStyle = "#300";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 3, size / 2, (size * 2) / 3);

    // Organic interface
    ctx.fillStyle = "#f88";
    ctx.beginPath();
    ctx.moveTo(x + size / 3, y + size / 3);
    ctx.bezierCurveTo(
      x + size / 2,
      y,
      x + (size * 2) / 3,
      y,
      x + (size * 2) / 3,
      y + size / 3
    );
    ctx.fill();

    // Bio-tubes
    ctx.strokeStyle = "#f0f";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 3 + (i * size) / 6, y + size / 3);
      ctx.lineTo(x + size / 3 + (i * size) / 6, y + (size * 2) / 3);
      ctx.stroke();
    }
  }
}
