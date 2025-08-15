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

  render(ctx, x, y, tileSize) {
    ctx.fillStyle = '#888'; // Default wall color
    // Adjust rendering based on direction
    switch (this.direction) {
      case 'top':
        ctx.fillRect(x, y, tileSize, tileSize * 0.1);
        break;
      case 'bottom':
        ctx.fillRect(x, y + tileSize * 0.9, tileSize, tileSize * 0.1);
        break;
      case 'left':
        ctx.fillRect(x, y, tileSize * 0.1, tileSize);
        break;
      case 'right':
        ctx.fillRect(x + tileSize * 0.9, y, tileSize * 0.1, tileSize);
        break;
    }
  }
}
