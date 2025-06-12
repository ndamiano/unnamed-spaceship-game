import GameObject from "./GameObject.js";

export default class HologramProjector extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Base platform (dark gray)
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + size / 2, size, size / 2);

    // Hologram projection (semi-transparent blue)
    ctx.fillStyle = "rgba(100, 200, 255, 0.5)";
    ctx.beginPath();
    ctx.moveTo(x + size / 4, y + size / 2);
    ctx.lineTo(x + (size * 3) / 4, y + size / 2);
    ctx.lineTo(x + size / 2, y);
    ctx.closePath();
    ctx.fill();

    // Scan lines effect
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 4, y + (i * size) / 8);
      ctx.lineTo(x + (size * 3) / 4, y + (i * size) / 8);
      ctx.stroke();
    }
  }
}
