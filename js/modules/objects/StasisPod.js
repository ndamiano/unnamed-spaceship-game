import GameObject from "./GameObject.js";

export default class StasisPod extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Pod base
    ctx.fillStyle = "#444";
    ctx.fillRect(x + size / 4, y + size / 2, size / 2, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 2, size / 2, size / 2);

    // Glass cover
    ctx.fillStyle = "rgba(200, 240, 255, 0.3)";
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
    ctx.strokeStyle = "#0af";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status indicators
    ctx.fillStyle = "#0f0";
    ctx.fillRect(x + size / 3, y + (size * 2) / 3, size / 6, size / 12);
    ctx.fillStyle = "#f00";
    ctx.fillRect(x + size / 2, y + (size * 2) / 3, size / 6, size / 12);
  }
}
