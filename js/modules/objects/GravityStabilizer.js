import GameObject from "./GameObject.js";

export default class GravityStabilizer extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Green circle with concentric rings
    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Concentric rings
    ctx.strokeStyle = "#0a0";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 2,
        y + size / 2,
        size / 2 - (i * size) / 6,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Center dot
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
