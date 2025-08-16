import { Tile } from './tile.js';
import { randomInt } from '../../utils/math-utils.js';

export class Floor extends Tile {
  constructor(x, y) {
    super(x, y, true);
    this.number = randomInt(1, 3);
  }
}
