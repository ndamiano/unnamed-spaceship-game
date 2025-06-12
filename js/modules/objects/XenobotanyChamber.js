import GameObject from "./GameObject.js";

export default class XenobotanyChamber extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Chamber base
    ctx.fillStyle = "#5a5";
    ctx.fillRect(x, y + size / 3, size, (size * 2) / 3);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + size / 3, size, (size * 2) / 3);

    // Glass dome
    ctx.fillStyle = "rgba(150, 255, 150, 0.2)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 3, size / 2, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Alien plants
    ctx.fillStyle = "#8f4";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 4 + (i * size) / 3, y + size / 2);
      ctx.bezierCurveTo(
        x + size / 4 + (i * size) / 3,
        y,
        x + size / 2 + (i * size) / 6,
        y,
        x + size / 2 + (i * size) / 6,
        y + size / 3
      );
      ctx.fill();
    }
  }
}
