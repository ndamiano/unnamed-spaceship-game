import GameObject from "./GameObject.js";

export default class BioScanner extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // White base
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);

    // Green scanner bed
    ctx.fillStyle = "#0f0";
    ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);

    // Scanning beam effect
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 4, y + size / 4 + (i * size) / 6);
      ctx.lineTo(x + (size * 3) / 4, y + size / 4 + (i * size) / 6);
      ctx.stroke();
    }

    // Control panel
    ctx.fillStyle = "#333";
    ctx.fillRect(x + size / 8, y + (size * 3) / 4, (size * 3) / 4, size / 8);
  }
}
