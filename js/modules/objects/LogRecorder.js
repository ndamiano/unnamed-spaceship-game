import GameObject from "./GameObject.js";

export default class LogRecorder extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Main body
    ctx.fillStyle = "#444";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Tape reels
    ctx.fillStyle = "#222";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 2,
        y + size / 2,
        size / 5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    }

    // Status lights
    ctx.fillStyle = "#0f0";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 4,
        y + size / 4,
        size / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
