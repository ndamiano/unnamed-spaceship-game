export class Tile {
  constructor(x, y, passable = false) {
    this.x = x;
    this.y = y;
    this.passable = passable;
    this.visible = false;
  }

  update() {
    // Base implementation - can be overridden
  }

  render(ctx, x, y, size) {
    // Base rendering logic - to be implemented
    // This will be called by the TileRenderer
  }
}
