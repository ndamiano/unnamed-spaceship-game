import GameObject from "./GameObject.js";

export default class DronePod extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Dark gray base
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);

    // Landing pad circles
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 2,
        y + size / 2,
        size / 4 + (i * size) / 8,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Drone silhouette in center
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size / 4);
    ctx.lineTo(x + (size * 3) / 4, y + (size * 3) / 4);
    ctx.lineTo(x + size / 4, y + (size * 3) / 4);
    ctx.closePath();
    ctx.fill();
  }
}
