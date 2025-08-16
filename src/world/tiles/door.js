import GameObject from '../../entities/objects/game-object.js';

export class Door extends GameObject {
  constructor(x, y, direction) {
    super(x, y, 'door');
    this.direction = direction;
    this.passable = true;
    this.blocksLineOfSight = true;
    this.width = 1;
    this.height = 1;
  }
}
