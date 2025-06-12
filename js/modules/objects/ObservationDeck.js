import GameObject from "./GameObject.js";

export default class ObservationDeck extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Base structure
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y + size / 2, size, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + size / 2, size, size / 2);

    // Glass dome
    ctx.fillStyle = "rgba(200, 240, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dome supports
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size / 2);
      ctx.lineTo(
        x + size / 2 + (size / 2) * Math.cos((i * Math.PI) / 2),
        y + size / 2 + (size / 2) * Math.sin((i * Math.PI) / 2)
      );
      ctx.stroke();
    }
  }
}
