import GameObject from "./GameObject.js";

export default class SecurityTerminal extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Terminal base
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + size / 3, size, (size * 2) / 3);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + size / 3, size, (size * 2) / 3);

    // Screen
    ctx.fillStyle = "#0a0";
    ctx.fillRect(x + size / 8, y + size / 2, (size * 3) / 4, size / 3);
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + size / 8, y + size / 2, (size * 3) / 4, size / 3);

    // Buttons
    ctx.fillStyle = "#f00";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 4,
        y + size / 3 + size / 8,
        size / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    }
  }
}
