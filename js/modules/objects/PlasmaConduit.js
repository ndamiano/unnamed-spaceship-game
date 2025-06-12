import GameObject from "./GameObject.js";

export default class PlasmaConduit extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Orange horizontal pipe with glowing center
    ctx.fillStyle = "#f80";
    ctx.fillRect(x, y + size / 3, size, size / 3);

    // Glowing center line
    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.stroke();

    // End caps
    ctx.fillStyle = "#f80";
    ctx.beginPath();
    ctx.arc(x, y + size / 2, size / 3, -Math.PI / 2, Math.PI / 2);
    ctx.arc(x + size, y + size / 2, size / 3, Math.PI / 2, -Math.PI / 2, true);
    ctx.fill();
  }
}
