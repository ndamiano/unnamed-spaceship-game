import GameObject from "./GameObject.js";

export default class WallMonitor extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Base structure
    ctx.fillStyle = "#88f";
    ctx.fillRect(x + size / 4, y + size / 2, size / 2, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 2, size / 2, size / 2);

    // Dish
    ctx.fillStyle = "#aaf";
    ctx.beginPath();
    ctx.ellipse(
      x + size / 2,
      y + size / 3,
      size / 3,
      size / 4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Antenna elements
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size / 3);
      ctx.lineTo(
        x + size / 2 + (size / 3) * Math.cos((i * Math.PI) / 3),
        y + size / 3 - (size / 3) * Math.sin((i * Math.PI) / 3)
      );
      ctx.stroke();
    }
  }
}
