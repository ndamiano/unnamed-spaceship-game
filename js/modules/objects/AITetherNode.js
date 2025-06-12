import GameObject from "./GameObject.js";

export default class AITetherNode extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Central node
    ctx.fillStyle = "#00f";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Connection points
    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(
        x + size / 2 + (size / 3) * Math.cos(angle),
        y + size / 2 + (size / 3) * Math.sin(angle)
      );
      ctx.lineTo(
        x + size / 2 + (size / 2) * Math.cos(angle),
        y + size / 2 + (size / 2) * Math.sin(angle)
      );
      ctx.stroke();
    }
  }
}
