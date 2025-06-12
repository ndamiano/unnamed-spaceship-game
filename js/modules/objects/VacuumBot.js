import GameObject from "./GameObject.js";

export default class VacuumBot extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Main body
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cleaning brushes
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4;
      ctx.beginPath();
      ctx.moveTo(
        x + size / 2 + (size / 4) * Math.cos(angle),
        y + size / 2 + (size / 4) * Math.sin(angle)
      );
      ctx.lineTo(
        x + size / 2 + (size / 2.5) * Math.cos(angle),
        y + size / 2 + (size / 2.5) * Math.sin(angle)
      );
      ctx.stroke();
    }

    // Status light
    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 3, size / 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
