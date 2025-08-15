// Fixed Ship.js - Properly restore map functionality
import { ShipMap } from './ship-map.js';
import { SpawnRoom } from '../rooms/index.js';
import { getStats } from '../../entities/player/player-stats.js';
import { Directions } from '../../utils/index.js';
import { eventBus } from '../../core/event-bus.js';
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
    eventBus.on('restore-ship-state', shipData => {
      this.restoreState(shipData);
    });
  }

  getSpawnPoint() {
    const spawnRoom = this.map.rooms.find(room => room instanceof SpawnRoom);

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

  render(ctx, tileSize) {
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

  // Check if tile is worth saving (has meaningful data)
  isTileSignificant(tile, _x, _y) {
    // Save if tile has been visited
    if (tile.visible) return true;

    // Save if tile has objects
    if (tile.object) return true;

    // Save if tile has slots (walls/doors)
    if (this.hasSlots(tile)) return true;

    // Save if tile is not passable (means it's been modified from default)
    if (!tile.passable) return true;

    // Save if tile blocks line of sight (modified from default)
    if (tile.blocksLineOfSight) return true;

    // Skip default empty floor tiles
    return false;
  }

  // Get current state for saving - highly optimized
  getSaveState() {
    const tiles = [];
    const bounds = this.findShipBounds();

    console.log(
      `Saving ship tiles within bounds: ${bounds.minX}-${bounds.maxX}, ${bounds.minY}-${bounds.maxY}`
    );

    // Only check tiles within the ship bounds
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const tile = this.map.getTile(x, y);

        if (!tile) continue;

        if (this.isTileSignificant(tile, x, y)) {
          const tileData = this.serializeTileCompact(tile, x, y);

          if (tileData) {
            tiles.push(tileData);
          }
        }
      }
    }

    console.log(
      `Saved ${tiles.length} significant tiles out of ${(bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1)} total tiles in bounds`
    );

    return {
      width: this.width,
      height: this.height,
      type: this.type,
      bounds: bounds, // Save the ship bounds for efficient restoration
      tiles: tiles,
      version: 2, // Version for migration
    };
  }

  // Find the actual bounds of the generated ship (ignore empty space)
  findShipBounds() {
    let minX = this.width,
      maxX = 0,
      minY = this.height,
      maxY = 0;
    let foundTiles = false;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.map.getTile(x, y);

        if (tile && this.isTileSignificant(tile, x, y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          foundTiles = true;
        }
      }
    }

    if (!foundTiles) {
      // Fallback if no significant tiles found
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // Add small padding to bounds
    const padding = 5;

    return {
      minX: Math.max(0, minX - padding),
      maxX: Math.min(this.width - 1, maxX + padding),
      minY: Math.max(0, minY - padding),
      maxY: Math.min(this.height - 1, maxY + padding),
    };
  }

  // Serialize tile in compact format
  serializeTileCompact(tile, x, y) {
    const data = [x, y]; // Always include position

    let flags = 0;
    const extras = {};

    // Use bit flags for common boolean properties
    if (tile.visible) flags |= 1;
    if (!tile.passable) flags |= 2; // Default is passable, so flag when NOT passable
    if (tile.blocksLineOfSight) flags |= 4; // Default is false, so flag when true

    data.push(flags);

    // Add tile number if not default (Floor tiles have random numbers 1-3)
    if (tile.number !== undefined && tile.number !== 1) {
      extras.n = tile.number;
    }

    // Add slots in compact format
    const slots = this.serializeSlotsCompact(tile);

    if (slots) {
      extras.s = slots;
    }

    // Add object in compact format
    if (tile.object) {
      extras.o = this.serializeObjectCompact(tile.object);
    }

    // Add extras if any exist
    if (Object.keys(extras).length > 0) {
      data.push(extras);
    }

    return data;
  }

  // Compact slot serialization
  serializeSlotsCompact(tile) {
    if (!tile.slots) return null;

    const slots = {};
    let hasSlots = false;

    ['top', 'right', 'bottom', 'left'].forEach((side, index) => {
      const slot = tile.slots[side];

      if (slot) {
        // Use single character keys and compact values
        const sideKey = 'trbl'[index]; // t=top, r=right, b=bottom, l=left

        let slotData = slot.constructor.name === 'WallSegment' ? 'w' : 'd'; // w=wall, d=door

        // Add flags for non-default properties
        if (!slot.passable && slot.constructor.name === 'Door') slotData += '!'; // Door that's not passable
        if (!slot.blocksLineOfSight && slot.constructor.name === 'WallSegment')
          slotData += '?'; // Wall that doesn't block LOS

        slots[sideKey] = slotData;
        hasSlots = true;
      }
    });

    return hasSlots ? slots : null;
  }

  // Compact object serialization
  serializeObjectCompact(obj) {
    const data = {
      t: obj.objectType, // t = type
    };

    // Only save non-default values
    if (obj.flipped) data.f = 1; // f = flipped
    if (obj.storyEventDetermined) data.d = 1; // d = determined
    if (obj.availableStoryFragments && obj.availableStoryFragments.size > 0) {
      data.sf = Array.from(obj.availableStoryFragments); // sf = story fragments
    }

    if (obj.availableStoryEvents && obj.availableStoryEvents.length > 0) {
      data.se = Array.from(obj.availableStoryEvents); // se = story events
    }

    // Save activation results state (only if modified)
    if (obj.activationResults && obj.activationResults.length > 0) {
      const modifiedResults = obj.activationResults.filter(
        result =>
          result.used || Object.prototype.hasOwnProperty.call(result, 'used')
      );

      if (modifiedResults.length > 0) {
        data.ar = modifiedResults.map(result => ({
          i: obj.activationResults.indexOf(result), // i = index
          u: result.used ? 1 : 0, // u = used
        }));
      }
    }

    return data;
  }

  // Check if tile has any slots
  hasSlots(tile) {
    return tile.slots && Object.values(tile.slots).some(slot => slot !== null);
  }

  // Restore ship state from save data
  restoreState(shipData) {
    console.log('Restoring ship state from optimized tile data...');

    if (!shipData || !shipData.tiles) {
      console.log('No valid ship tile data to restore');

      return;
    }

    this.isRestored = true;

    // Replace the entire map with saved data instead of mixing old and new
    this.createMapFromSaveData(shipData);

    console.log(`Ship state restored: ${shipData.tiles.length} tiles loaded`);
    eventBus.emit(
      'game-message',
      `Ship layout restored: ${shipData.tiles.length} areas loaded`
    );
  }

  // Create a completely new map from save data (no mixing with generated content)
  async createMapFromSaveData(shipData) {
    console.log('Creating clean map from save data...');

    // Create a fresh ShipMap but without running generation
    this.map = this.createEmptyShipMap();

    // Restore all saved tiles (now with async support)
    const restorePromises = shipData.tiles.map(tileData =>
      this.restoreSingleTile(tileData)
    );

    await Promise.all(restorePromises);

    console.log('Clean map created from save data');
  }

  // Create an empty ShipMap without running room generation
  createEmptyShipMap() {
    // Import ShipMap but create it in "restore mode"
    const map = Object.create(ShipMap.prototype);

    map.width = this.width;
    map.height = this.height;
    map.type = this.type;
    map.rooms = []; // Empty rooms array

    // Create empty tile grid
    map.tiles = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => new Floor(x, y))
    );

    // Bind the essential methods from a real ShipMap
    const tempMap = new ShipMap(1, 1, this.type); // Tiny temporary map for method binding

    map.getTile = ShipMap.prototype.getTile.bind(map);
    map.hasLineOfSight = tempMap.hasLineOfSight.bind(map);
    map.revealAreaAroundPlayer = tempMap.revealAreaAroundPlayer.bind(map);

    // Set up event listeners for player movement reveals
    eventBus.on('player-updated', player => {
      map.revealAreaAroundPlayer(player.x, player.y, 2);
    });

    return map;
  }

  // Restore a single tile from save data
  async restoreSingleTile(tileData) {
    const [x, y, flags, extras] = tileData;

    // Get the tile from the map
    const tile = this.map.getTile(x, y);

    if (!tile) {
      console.warn(`No tile at ${x}, ${y} - skipping restore`);

      return;
    }

    // Restore flags
    tile.visible = !!(flags & 1);
    tile.passable = !(flags & 2); // Inverted because default is passable
    tile.blocksLineOfSight = !!(flags & 4);

    // Restore extras if present
    if (extras) {
      // Restore tile number
      if (extras.n !== undefined) {
        tile.number = extras.n;
      }

      // Restore slots
      if (extras.s) {
        this.restoreSlotsToTile(tile, extras.s);
      }

      // Restore object (now async)
      if (extras.o) {
        await this.restoreObjectToTile(tile, extras.o);
      }
    }
  }

  // Restore slots to an existing tile
  restoreSlotsToTile(tile, slotsData) {
    const sideMap = { t: 'top', r: 'right', b: 'bottom', l: 'left' };

    Object.entries(slotsData).forEach(([sideKey, slotData]) => {
      const side = sideMap[sideKey];

      if (!side) return;

      const isWall = slotData.startsWith('w');
      const direction = side;

      let slot;

      if (isWall) {
        slot = new WallSegment(tile.x, tile.y, direction);
        slot.passable = false;
        slot.blocksLineOfSight = !slotData.includes('?'); // Default true, ? means false
      } else {
        slot = new Door(tile.x, tile.y, direction);
        slot.passable = !slotData.includes('!'); // Default true, ! means false
        slot.blocksLineOfSight = true;
      }

      tile.setSlot(side, slot);
    });
  }

  // Restore object to an existing tile
  async restoreObjectToTile(tile, objectData) {
    console.log('Restoring object from data:', objectData);

    try {
      // Create the object
      const obj = new GameObject(tile.x, tile.y, objectData.t);

      // Restore basic object state
      obj.flipped = !!objectData.f;
      obj.storyEventDetermined = !!objectData.d;

      // Restore story fragments
      if (objectData.sf && Array.isArray(objectData.sf)) {
        obj.availableStoryFragments = new Set(objectData.sf);
        console.log(obj);
        console.log('Restored story fragments:', objectData.sf);
      } else {
        obj.availableStoryFragments = new Set();
      }

      // Restore story events
      if (objectData.se && Array.isArray(objectData.se)) {
        obj.availableStoryEvents = objectData.se.map(event => ({
          type: event.type,
          fragmentId: event.fragmentId,
          content: event.content,
        }));
        console.log('Restored story events:', objectData.se);
      } else {
        obj.availableStoryEvents = [];
      }

      // Restore story configuration if saved
      if (objectData.sg) {
        obj.storyGroupId = objectData.sg;
        console.log('Restored story group:', objectData.sg);
      }

      if (objectData.sc !== undefined) {
        obj.storyChance = objectData.sc;
      }

      if (objectData.gs) {
        obj.guaranteedStory = true;
      }

      // Restore activation results
      if (objectData.ar && obj.activationResults) {
        objectData.ar.forEach(({ i, u }) => {
          if (obj.activationResults[i]) {
            obj.activationResults[i].used = !!u;
          }
        });
      }

      // Set the object on the tile
      tile.object = obj;
      tile.passable = obj.passable;

      console.log('Object restored:', {
        type: obj.objectType,
        position: [obj.x, obj.y],
        storyGroupId: obj.storyGroupId,
        fragmentsCount: obj.availableStoryFragments.size,
        eventsCount: obj.availableStoryEvents.length,
        determined: obj.storyEventDetermined,
        hasActivatableStory: obj.hasAvailableStory(),
      });

      // Re-register with story system using event bus
      if (obj.storyGroupId) {
        setTimeout(() => {
          console.log(
            'Re-registering object with story system:',
            obj.objectType,
            'at',
            obj.x,
            obj.y
          );
          eventBus.emit('register-story-object', obj);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to restore object:', error);

      // Fallback: create a minimal object structure
      const obj = {
        x: tile.x,
        y: tile.y,
        objectType: objectData.t,
        flipped: !!objectData.f,
        storyEventDetermined: !!objectData.d,
        availableStoryFragments: new Set(objectData.sf || []),
        availableStoryEvents: (objectData.se || []).map(event => ({
          type: event.type,
          fragmentId: event.fragmentId,
          content: event.content,
        })),
        storyGroupId: objectData.sg || null,
        storyChance: objectData.sc || 0,
        guaranteedStory: !!objectData.gs,
        activationResults: [],
        passable: false,

        // Essential methods
        hasAvailableStory() {
          return this.availableStoryEvents.length > 0;
        },

        isActivatable() {
          return (
            this.hasAvailableStory() ||
            (this.activationResults && this.activationResults.length > 0)
          );
        },

        render(ctx, x, y, size) {
          // Basic rendering fallback
          if (this.isActivatable()) {
            ctx.save();
            ctx.fillStyle = this.hasAvailableStory()
              ? '#ffffff40'
              : '#03517040';
            ctx.fillRect(
              x - size * 0.1,
              y - size * 0.1,
              size * 1.2,
              size * 1.2
            );
            ctx.restore();
          }

          // Draw basic object representation
          ctx.fillStyle = '#f00';
          ctx.fillRect(x, y, size, size);
        },
      };

      tile.object = obj;
      tile.passable = obj.passable;

      console.log(
        'Fallback object created:',
        obj.objectType,
        'at',
        obj.x,
        obj.y
      );
    }
  }
}
