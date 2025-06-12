import GameObject from "./GameObject.js";

export default class BlackBoxCore extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Main body
    ctx.fillStyle = "#111";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Indicator lights
    ctx.fillStyle = "#f00";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 2,
        y + size / 4,
        size / 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Heat fins
    ctx.fillStyle = "#333";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(
        x + size / 3,
        y + size / 2 + (i * size) / 6,
        size / 3,
        size / 12
      );
    }
  }
}
