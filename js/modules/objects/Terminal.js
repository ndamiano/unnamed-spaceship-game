import GameObject from "./GameObject.js";

export default class Terminal extends GameObject {
  static SPRITE = "terminal";

  onInteract(player) {
    // Terminal interaction logic
    console.log("Terminal interacted with by player");
  }
  render(ctx, x, y, size) {
    // Terminal base
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);

    // Screen
    ctx.fillStyle = "#0a0";
    const pad = size * 0.15;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);

    // Screen content
    ctx.fillStyle = "#0f0";
    ctx.font = `${size * 0.2}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(">_", x + size / 2, y + size / 2 + size * 0.1);
  }
}
