import GameObject from "./GameObject.js";

export default class HygienePod extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Circular pod base
    ctx.fillStyle = "#aaf";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Steam lines
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size / 4);
      ctx.bezierCurveTo(
        x + size / 2 + (size / 4) * Math.sin(i),
        y - size / 8,
        x + size / 2 + (size / 4) * Math.cos(i),
        y - size / 4,
        x + size / 2 + (size / 3) * Math.sin(i),
        y - size / 3
      );
      ctx.stroke();
    }
  }
}
