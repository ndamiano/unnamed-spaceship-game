import { Tile } from "../Tile.js";

export default class GameObject extends Tile {
  constructor(x, y, passable = false, blocksLineOfSight = false) {
    super(x, y, passable, blocksLineOfSight);
    this.flipped = false;
  }

  flip() {
    this.flipped = !this.flipped;
    return this;
  }

  render(ctx, x, y, size) {
    if (this.flipped) {
      ctx.save();
      ctx.scale(-1, 1);
      if (this.name) {
        const assetImage = new Image();
        assetImage.src = `assets/${this.name}-100x100.png`;
        ctx.drawImage(assetImage, -x - size, y);
      } else {
        ctx.fillStyle = "#f00";
        ctx.fillRect(x, y, size, size);
      }
      ctx.restore();
    } else {
      if (this.name) {
        const assetImage = new Image();
        assetImage.src = `assets/${this.name}-100x100.png`;
        ctx.drawImage(assetImage, x, y);
      } else {
        ctx.fillStyle = "#f00";
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}
