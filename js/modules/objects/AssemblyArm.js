import GameObject from "./GameObject.js";

export default class AssemblyArm extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Base
    ctx.fillStyle = "#777";
    ctx.fillRect(x + size / 3, y + size / 2, size / 3, size / 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 3, y + size / 2, size / 3, size / 2);

    // Arm segments
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Vertical segment
    ctx.moveTo(x + size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 4);
    // Horizontal segment
    ctx.lineTo(x + size / 4, y + size / 4);
    // End effector
    ctx.lineTo(x + size / 4, y);
    ctx.stroke();

    // Joints
    ctx.fillStyle = "#333";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(
        x + size / 2,
        y + size / 2 - (i * size) / 4,
        size / 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
