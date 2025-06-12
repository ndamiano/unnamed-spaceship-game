import GameObject from "./GameObject.js";

export default class OxygenRecycler extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Blue circle with white center
    ctx.fillStyle = "#00f";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // White center circle
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
