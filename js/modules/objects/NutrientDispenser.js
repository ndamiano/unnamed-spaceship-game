import GameObject from "./GameObject.js";

export default class NutrientDispenser extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // White base
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);

    // Blue dispenser body
    ctx.fillStyle = "#00f";
    ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);

    // Dispenser slot
    ctx.fillStyle = "#000";
    ctx.fillRect(x + size / 3, y + (size * 3) / 4, size / 3, size / 8);

    // Control panel
    ctx.fillStyle = "#333";
    ctx.fillRect(x + size / 4, y + size / 8, size / 2, size / 8);
  }
}
