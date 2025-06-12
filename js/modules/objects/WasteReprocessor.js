import GameObject from "./GameObject.js";

export default class WasteReprocessor extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Dark green base
    ctx.fillStyle = "#006400";
    ctx.fillRect(x, y, size, size);

    // Brown processing chamber
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);

    // Input/output pipes
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y + size / 3, size / 4, size / 6);
    ctx.fillRect(x + (size * 3) / 4, y + size / 3, size / 4, size / 6);

    // Control panel
    ctx.fillStyle = "#000";
    ctx.fillRect(x + size / 4, y + size / 8, size / 2, size / 8);
  }
}
