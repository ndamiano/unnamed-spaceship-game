import GameObject from "./GameObject.js";

export default class ShipAICoreNode extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Purple diamond shape
    ctx.fillStyle = "#a0a";
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size / 2);
    ctx.lineTo(x + size / 2, y + size);
    ctx.lineTo(x, y + size / 2);
    ctx.closePath();
    ctx.fill();

    // White center circle
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
