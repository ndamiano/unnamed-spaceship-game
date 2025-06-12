import GameObject from "./GameObject.js";

export default class QuarantineChamber extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Chamber base with warning stripes
    ctx.fillStyle = "#ff0";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Diagonal warning stripes
    ctx.fillStyle = "#f00";
    for (let i = -size; i < size * 2; i += size / 4) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + size / 4, y);
      ctx.lineTo(x + i + size / 4 - size / 4, y + size);
      ctx.lineTo(x + i - size / 4, y + size);
      ctx.fill();
    }

    // Biohazard symbol
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0";
    ctx.fill();
  }
}
