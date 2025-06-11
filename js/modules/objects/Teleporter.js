import GameObject from "./GameObject.js";

export default class Teleporter extends GameObject {
  static SPRITE = "teleporter";

  linkWith(teleporter) {
    this.target = teleporter;
  }

  onInteract(player) {
    if (this.target) {
      // todo:: This should emit a player_teleport event
    } else {
      console.log("Shit, teleporter's fried");
    }
  }

  render(ctx, x, y, size) {
    // Outer ring
    ctx.fillStyle = "#55f";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = "#aaf";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Energy effect
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const outerX = x + size / 2 + (Math.cos(angle) * size) / 2;
      const outerY = y + size / 2 + (Math.sin(angle) * size) / 2;
      const innerX = x + size / 2 + (Math.cos(angle) * size) / 3;
      const innerY = y + size / 2 + (Math.sin(angle) * size) / 3;
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.stroke();
  }
}
