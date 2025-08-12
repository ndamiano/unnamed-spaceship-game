export class Tile {
  constructor(x, y, passable = false, blocksLineOfSight = false) {
    this.x = x;
    this.y = y;
    this.passable = passable;
    this.blocksLineOfSight = blocksLineOfSight;
    this.visible = false;
    this.slots = {
      top: null,
      right: null,
      bottom: null,
      left: null,
    };
  }

  update() {
    // Base implementation - can be overridden
  }

  setSlot(side, object) {
    if (['top', 'right', 'bottom', 'left'].includes(side)) {
      this.slots[side] = object;
    }
  }

  getSlot(side) {
    return this.slots[side];
  }

  render(ctx, x, y) {
    // Base rendering logic - to be implemented
    // This will be called by the TileRenderer
    this.renderSlots(ctx, x, y);
  }

  renderSlots(ctx, x, y) {
    // Render each slot's content if it exists
    for (const [_side, object] of Object.entries(this.slots)) {
      if (object && object.render) {
        object.render(ctx, x, y, 100); // Assuming standard tile size of 100
      }
    }
  }
}
