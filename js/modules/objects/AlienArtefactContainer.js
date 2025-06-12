import GameObject from "./GameObject.js";

export default class AlienArtefactContainer extends GameObject {
  constructor(x, y) {
    super(x, y);
  }

  render(ctx, x, y, size) {
    // Container body
    ctx.fillStyle = "#333";
    ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size / 4, y + size / 4, size / 2, size / 2);

    // Alien symbols
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size / 3);
      ctx.lineTo(
        x + size / 2 + (size / 6) * Math.cos((i * Math.PI) / 2),
        y + size / 2 + (size / 6) * Math.sin((i * Math.PI) / 2)
      );
      ctx.stroke();
    }

    // Glowing center
    const gradient = ctx.createRadialGradient(
      x + size / 2,
      y + size / 2,
      0,
      x + size / 2,
      y + size / 2,
      size / 6
    );
    gradient.addColorStop(0, "#0f0");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(x + size / 3, y + size / 3, size / 3, size / 3);
  }
}
