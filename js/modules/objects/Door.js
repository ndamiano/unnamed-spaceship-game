import GameObject from "./GameObject.js";

export class Door extends GameObject {
  constructor(x, y) {
    super(x, y, true, true);
  }

  render(ctx, x, y, size) {
    // Door frame
    ctx.fillStyle = "#642";
    ctx.fillRect(x, y, size, size);

    // Door panel
    ctx.fillStyle = "#853";
    const margin = size * 0.15;
    ctx.fillRect(x + margin, y + margin, size - margin * 2, size - margin * 2);

    // Door handle
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + size * 0.8, y + size / 2, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}
