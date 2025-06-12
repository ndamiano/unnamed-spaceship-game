import GameObject from "./GameObject.js";

export default class PsychoNeuralChair extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Chair base
    ctx.fillStyle = "#333";
    ctx.fillRect(x + size / 4, y + size / 2, size / 2, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 2, size / 2, size / 2);

    // Backrest
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(x + size / 4, y + size / 2);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + (size * 3) / 4, y + size / 2);
    ctx.fill();
    ctx.stroke();

    // Neural nodes
    ctx.fillStyle = "#f0f";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 4 + (i * size) / 4,
        y + size / 3,
        size / 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
