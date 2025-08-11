import { ShipMap } from "./ShipMap.js";
import { SpawnRoom } from "../rooms/index.js";
import { getStats } from "../PlayerStats.js";
import { Directions } from "../Utils.js";

export class Ship {
  constructor(width, height, type = "colony") {
    this.width = width;
    this.height = height;
    this.map = new ShipMap(width, height, type);
  }

  getSpawnPoint() {
    const spawnRoom = this.map.rooms.find((room) => room instanceof SpawnRoom);
    return {
      x: Math.floor(spawnRoom.x + spawnRoom.width / 2),
      y: Math.floor(spawnRoom.y + spawnRoom.height / 2),
    };
  }
  revealAreaAroundPlayer(x, y, radius) {
    this.map.revealAreaAroundPlayer(x, y, radius);
  }
  canMoveTo(x, y, direction) {
    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height)
      return false;

    const tile = this.map.getTile(x, y);
    if (!tile.passable) return false;

    const player = getStats();

    // Check for wall segments between current and target position
    const currentTile = this.map.getTile(player.x, player.y);
    if (!currentTile) return false;

    switch (direction) {
      case Directions.RIGHT:
        // Moving right
        if (currentTile.getSlot("right")?.passable === false) return false;
        if (tile.getSlot("left")?.passable === false) return false;
        break;
      case Directions.LEFT:
        // Moving left
        if (currentTile.getSlot("left")?.passable === false) return false;
        if (tile.getSlot("right")?.passable === false) return false;
        break;
      case Directions.DOWN:
        // Moving down
        if (currentTile.getSlot("bottom")?.passable === false) return false;
        if (tile.getSlot("top")?.passable === false) return false;
        break;
      case Directions.UP:
        // Moving up
        if (currentTile.getSlot("top")?.passable === false) return false;
        if (tile.getSlot("bottom")?.passable === false) return false;
        break;
    }
    return true;
  }
  attemptInteract(targetX, targetY) {
    const tile = this.map.getTile(targetX, targetY);
    console.log(tile);
    if (!tile) return;
    if (typeof tile.onInteract === "function") {
      tile.onInteract();
    }
    if (tile.object && typeof tile.object.onInteract === "function") {
      tile.object.onInteract();
    }
  }

  render(ctx, tileSize) {
    // Render tiles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.map.getTile(x, y);
        if (tile && tile.visible) {
          tile.render(ctx, x * tileSize, y * tileSize, tileSize);
          if (tile.object != undefined) {
            tile.object.render(ctx, x * tileSize, y * tileSize, tileSize);
          }
        }
      }
    }
  }
}
