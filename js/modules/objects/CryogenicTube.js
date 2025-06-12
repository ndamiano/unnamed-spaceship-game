import GameObject from "./GameObject.js";

export default class CryogenicTube extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Light blue vertical capsule shape
    ctx.fillStyle = "#aaf";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 4, size / 4, Math.PI, 0);
    ctx.rect(x + size / 4, y + size / 4, size / 2, size / 2);
    ctx.arc(x + size / 2, y + (size * 3) / 4, size / 4, 0, Math.PI);
    ctx.fill();

    // Frost effect lines
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const offset = size / 8 + (i * size) / 4;
      ctx.beginPath();
      ctx.moveTo(x + size / 4, y + offset);
      ctx.lineTo(x + (size * 3) / 4, y + offset);
      ctx.stroke();
    }
  }
}
