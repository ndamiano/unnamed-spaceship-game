import { Tile } from "../Tile.js";

export class Wall extends Tile {
  constructor(x, y) {
    super(x, y, false, true);
  }

  render(ctx, x, y) {
    const assetImage = new Image();
    assetImage.src = `assets/wall1-100x100.png`;
    ctx.drawImage(assetImage, x, y);

    // ctx.fillStyle = "#333";
    // ctx.fillRect(x, y, size, size);

    // // Add texture
    // ctx.fillStyle = "#444";
    // for (let i = 0; i < 3; i++) {
    //   const offset = size * 0.2 + i * size * 0.2;
    //   ctx.fillRect(x + offset, y + offset, size * 0.1, size * 0.1);
    // }
  }
}
