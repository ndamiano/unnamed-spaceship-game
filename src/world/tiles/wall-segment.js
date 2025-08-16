import GameObject from '../../entities/objects/game-object.js';

export class WallSegment extends GameObject {
  constructor(x, y, direction) {
    super(x, y, 'wallSegment');
    this.direction = direction;
    this.passable = false;
    this.blocksLineOfSight = true;
    this.width = 1;
    this.height = 1;
  }
}
