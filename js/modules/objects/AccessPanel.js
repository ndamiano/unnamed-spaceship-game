import GameObject from "./GameObject.js";

export default class AccessPanel extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Dark gray panel background
    ctx.fillStyle = "#444";
    ctx.fillRect(x, y, size, size);

    // Panel details
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 4, size / 2, size / 2);

    // Screws in corners
    ctx.fillStyle = "#777";
    const screwPositions = [
      [x + size / 4, y + size / 4],
      [x + (size * 3) / 4, y + size / 4],
      [x + size / 4, y + (size * 3) / 4],
      [x + (size * 3) / 4, y + (size * 3) / 4],
    ];

    screwPositions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], size / 16, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
