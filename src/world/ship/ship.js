import { ShipMap } from './ship-map.js';
import { getStats } from '../../entities/player/player-stats.js';
import { Directions } from '../../utils/index.js';
import { eventBus } from '../../core/event-bus.js';
import { GameEvents } from '../../core/game-events.js';
import { Floor } from '../tiles/floor.js';
import { WallSegment } from '../tiles/wall-segment.js';
import { Door } from '../tiles/door.js';
import GameObject from '../../entities/objects/game-object.js';

export class Ship {
  constructor(width, height, type = 'colony') {
    this.width = width;
    this.height = height;
    this.type = type;
    this.map = new ShipMap(width, height, type);
    this.isRestored = false;

    // Listen for save/restore events
    GameEvents.Save.Listeners.restoreShip(shipData => {
      this.restoreState(shipData);
    });
  }

  getSpawnPoint() {
    console.log(this.map.rooms[0]);
    const spawnRoom = this.map.rooms.find(room => room.id == 'spawn');

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
    const currentTile = this.map.getTile(player.x, player.y);

    if (!currentTile) return false;

    // Check walls/doors in the direction of movement
    switch (direction) {
      case Directions.RIGHT:
        if (currentTile.getSlot('right')?.passable === false) return false;
        if (tile.getSlot('left')?.passable === false) return false;
        break;
      case Directions.LEFT:
        if (currentTile.getSlot('left')?.passable === false) return false;
        if (tile.getSlot('right')?.passable === false) return false;
        break;
      case Directions.DOWN:
        if (currentTile.getSlot('bottom')?.passable === false) return false;
        if (tile.getSlot('top')?.passable === false) return false;
        break;
      case Directions.UP:
        if (currentTile.getSlot('top')?.passable === false) return false;
        if (tile.getSlot('bottom')?.passable === false) return false;
        break;
    }

    return true;
  }

  attemptInteract(targetX, targetY) {
    const tile = this.map.getTile(targetX, targetY);

    if (!tile) return;

    if (typeof tile.onInteract === 'function') {
      tile.onInteract();
    }

    if (tile.object && typeof tile.object.onInteract === 'function') {
      tile.object.onInteract();
    }
  }

  // Simplified save state - just save what we need
  getSaveState() {
    const tiles = [];

    // Find the actual bounds of the ship (ignore empty areas)
    const bounds = this.findShipBounds();

    // Only save tiles within the ship bounds that have been modified
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const tile = this.map.getTile(x, y);

        if (!tile) continue;

        // Only save tiles that have been explored or have content
        if (
          tile.visible ||
          tile.object ||
          this.hasWalls(tile) ||
          !tile.passable
        ) {
          tiles.push({
            x,
            y,
            visible: tile.visible,
            passable: tile.passable,
            number: tile.number,
            object: tile.object ? this.serializeObject(tile.object) : null,
            walls: this.serializeWalls(tile),
          });
        }
      }
    }

    console.log(`Saving ${tiles.length} significant tiles`);

    return {
      width: this.width,
      height: this.height,
      type: this.type,
      bounds,
      tiles,
    };
  }

  findShipBounds() {
    let minX = this.width,
      maxX = 0,
      minY = this.height,
      maxY = 0;
    let foundTiles = false;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.map.getTile(x, y);

        if (tile && (tile.visible || tile.object || this.hasWalls(tile))) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          foundTiles = true;
        }
      }
    }

    if (!foundTiles) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // Add small padding
    const padding = 5;

    return {
      minX: Math.max(0, minX - padding),
      maxX: Math.min(this.width - 1, maxX + padding),
      minY: Math.max(0, minY - padding),
      maxY: Math.min(this.height - 1, maxY + padding),
    };
  }

  serializeObject(obj) {
    if (!obj) return null;

    return {
      type: obj.objectType,
      flipped: obj.flipped || false,
      storyData: obj.getSaveState
        ? obj.getSaveState()
        : {
            determined: obj.storyEventDetermined || false,
            fragments: Array.from(obj.availableStoryFragments || []),
            events: obj.availableStoryEvents || [],
            groupId: obj.storyGroupId,
            used: obj.storyUsed || false,
          },
      activationResults: obj.activationResults || [],
    };
  }

  serializeWalls(tile) {
    if (!tile.slots) return null;

    const walls = {};

    ['top', 'right', 'bottom', 'left'].forEach(side => {
      const slot = tile.slots[side];

      if (slot) {
        walls[side] = {
          type: slot.constructor.name,
          passable: slot.passable,
          blocksLineOfSight: slot.blocksLineOfSight,
        };
      }
    });

    return Object.keys(walls).length > 0 ? walls : null;
  }

  hasWalls(tile) {
    return tile.slots && Object.values(tile.slots).some(slot => slot !== null);
  }

  // Simplified restore state
  restoreState(shipData) {
    console.log('Restoring ship state...');

    if (!shipData?.tiles) {
      console.log('No ship data to restore');

      return;
    }

    this.isRestored = true;

    // Create fresh map without room generation
    this.map = this.createEmptyMap();

    // Restore each saved tile
    shipData.tiles.forEach(tileData => {
      this.restoreTile(tileData);
    });

    console.log(`Ship restored: ${shipData.tiles.length} tiles loaded`);
    GameEvents.Game.Emit.message(
      `Ship layout restored: ${shipData.tiles.length} areas loaded`
    );
  }

  createEmptyMap() {
    // Create map structure without room generation
    const map = Object.create(ShipMap.prototype);

    map.width = this.width;
    map.height = this.height;
    map.type = this.type;
    map.rooms = [];

    // Create empty tile grid
    map.tiles = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => new Floor(x, y))
    );

    // Bind essential methods
    map.getTile = ShipMap.prototype.getTile.bind(map);
    map.hasLineOfSight = ShipMap.prototype.hasLineOfSight.bind(map);
    map.revealAreaAroundPlayer =
      ShipMap.prototype.revealAreaAroundPlayer.bind(map);

    // Set up event listener for player movement reveals
    eventBus.on('player-updated', player => {
      map.revealAreaAroundPlayer(player.x, player.y, 2);
    });

    return map;
  }

  restoreTile(tileData) {
    const tile = this.map.getTile(tileData.x, tileData.y);

    if (!tile) {
      console.warn(`No tile at ${tileData.x}, ${tileData.y}`);

      return;
    }

    // Restore basic tile properties
    tile.visible = tileData.visible;
    tile.passable = tileData.passable;
    if (tileData.number) tile.number = tileData.number;

    // Restore walls
    if (tileData.walls) {
      this.restoreWalls(tile, tileData.walls);
    }

    // Restore object
    if (tileData.object) {
      tile.object = this.restoreObject(tileData.object, tileData.x, tileData.y);
      if (tile.object) {
        tile.passable = tile.object.passable;
      }
    }
  }

  restoreWalls(tile, wallsData) {
    Object.entries(wallsData).forEach(([side, wallData]) => {
      let wall;

      if (wallData.type === 'WallSegment') {
        wall = new WallSegment(tile.x, tile.y, side);
      } else if (wallData.type === 'Door') {
        wall = new Door(tile.x, tile.y, side);
      } else {
        return;
      }

      wall.passable = wallData.passable;
      wall.blocksLineOfSight = wallData.blocksLineOfSight;
      tile.setSlot(side, wall);
    });
  }

  restoreObject(objData, x, y) {
    try {
      const obj = new GameObject(x, y, objData.type);

      obj.flipped = objData.flipped;

      // Restore story data
      if (objData.storyData) {
        obj.storyEventDetermined = objData.storyData.determined;
        obj.availableStoryFragments = new Set(
          objData.storyData.fragments || []
        );
        obj.availableStoryEvents = objData.storyData.events || [];
        obj.storyGroupId = objData.storyData.groupId;
        obj.storyUsed = objData.storyData.used;
      }

      // Restore activation results
      if (objData.activationResults) {
        obj.activationResults = objData.activationResults;
      }

      // Re-register with story system if needed
      if (obj.storyGroupId) {
        setTimeout(() => {
          eventBus.emit('register-story-object', obj);
        }, 100);
      }

      return obj;
    } catch (error) {
      console.error('Failed to restore object:', error);

      // Create fallback object
      return {
        x,
        y,
        objectType: objData.type,
        flipped: objData.flipped || false,
        passable: false,
        isActivatable: () => false,
        onInteract: () =>
          eventBus.emit('game-message', 'This object appears to be damaged.'),
      };
    }
  }
}
