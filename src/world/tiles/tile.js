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
}
