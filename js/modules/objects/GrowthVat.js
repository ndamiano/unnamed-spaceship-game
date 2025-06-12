import GameObject from "./GameObject.js";

export default class GrowthVat extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Tank body
    ctx.fillStyle = "#5af";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 3, size / 2, size / 4, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(x, y + size / 3, size, size / 2);
    ctx.beginPath();
    ctx.ellipse(
      x + size / 2,
      y + (size * 5) / 6,
      size / 2,
      size / 4,
      0,
      0,
      Math.PI
    );
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bubbles
    ctx.fillStyle = "#aef";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 6,
        y + size / 2 + (i * size) / 10,
        size / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
