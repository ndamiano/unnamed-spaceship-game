import { Tile } from './tile.js';
import { randomInt } from '../../utils/math-utils.js';

export class Floor extends Tile {
  constructor(x, y) {
    super(x, y, true);
    this.number = randomInt(1, 3);
  }

  render(ctx, x, y) {
    const assetImage = new Image();

    assetImage.src = `assets/tile${this.number}-100x100.png`;
    ctx.drawImage(assetImage, x, y);
    this.renderSlots(ctx, x, y);
    // ctx.fillText(x / 100 + "," + y / 100, x, y);
  }
}
