import GameObject from "./GameObject.js";

export default class CombatDroidCradle extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Base platform
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y + size / 2, size, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + size / 2, size, size / 2);

    // Droid silhouette
    ctx.fillStyle = "#333";
    ctx.beginPath();
    // Head
    ctx.arc(x + size / 2, y + size / 3, size / 6, 0, Math.PI * 2);
    // Body
    ctx.rect(x + size / 3, y + size / 3, size / 3, size / 3);
    // Legs
    ctx.moveTo(x + size / 3, y + (size * 2) / 3);
    ctx.lineTo(x + size / 2, y + size);
    ctx.lineTo(x + (size * 2) / 3, y + (size * 2) / 3);
    ctx.fill();

    // Charging indicators
    ctx.fillStyle = "#0f0";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 2,
        y + size / 4,
        size / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
