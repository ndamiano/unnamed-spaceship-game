// src/world/ship/section-map.js
import { Floor } from '../tiles/floor.js';
import { WallSegment } from '../tiles/wall-segment.js';
import { Door } from '../tiles/door.js';
import { getPossibleDoorPositions, randomInt } from '../../utils/math-utils.js';
import { GameEvents } from '../../core/game-events.js';

export class SectionMap {
  constructor(width, height, sectionDefinition) {
    this.width = width;
    this.height = height;
    this.sectionDef = sectionDefinition;
    this.tiles = this.createEmptyGrid();
    this.rooms = [];
    this.maxRooms = sectionDefinition.roomCount.max;
    this.spawnRoom = null;

    // Setup event listeners for player movement
    this.setupEventListeners();
  }

  setupEventListeners() {
    GameEvents.Player.Listeners.updated(player => {
      this.revealAreaAroundPlayer(player.x, player.y, 2);
    });
  }

  createEmptyGrid() {
    return Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => new Floor(x, y))
    );
  }

  getTile(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    }

    return null;
  }

  setTile(x, y, properties) {
    const tile = this.getTile(x, y);

    if (tile) {
      Object.assign(tile, properties);
    }
  }

  canPlaceMoreRooms() {
    return this.rooms.length < this.maxRooms;
  }

  placeRoom(room) {
    // Handle first room (spawn) placement
    if (this.rooms.length === 0) {
      return this.placeSpawnRoom(room);
    }

    // For required rooms, try multiple strategies to ensure placement
    if (this.isRequiredRoom(room)) {
      return this.placeRequiredRoom(room);
    }

    // For theme rooms, use standard placement
    return this.placeThemeRoom(room);
  }

  isRequiredRoom(room) {
    return (
      room.id === 'neuralInterface' ||
      room.id === 'shipComplete' ||
      room.isSpawn ||
      room.isFinish ||
      room.isNeuralInterface ||
      room.isShipComplete
    );
  }

  placeRequiredRoom(room) {
    console.log(`Placing required room: ${room.id || room.constructor.name}`);

    // Strategy 1: Try normal placement with validation
    let placementOptions = this.findValidPlacements(room);

    if (placementOptions.length > 0) {
      const placement =
        placementOptions[randomInt(0, placementOptions.length - 1)];

      return this.executeRoomPlacement(room, placement);
    }

    console.warn(
      `Required room ${room.id} failed normal placement, trying relaxed validation...`
    );

    // Strategy 2: Try with relaxed validation for required rooms
    placementOptions = this.findValidPlacements(room, true); // relaxed = true

    if (placementOptions.length > 0) {
      const placement =
        placementOptions[randomInt(0, placementOptions.length - 1)];

      return this.executeRoomPlacement(room, placement);
    }

    console.warn(
      `Required room ${room.id} failed relaxed placement, trying anywhere with connections...`
    );

    // Strategy 3: Try placing anywhere that has at least one connection
    placementOptions = this.findAnyValidPlacement(room);

    if (placementOptions.length > 0) {
      const placement =
        placementOptions[randomInt(0, placementOptions.length - 1)];

      return this.executeRoomPlacement(room, placement);
    }

    console.error(
      `CRITICAL: Failed to place required room ${room.id}! This should never happen.`
    );

    return false;
  }

  placeThemeRoom(room) {
    const placementOptions = this.findValidPlacements(room);

    if (placementOptions.length === 0) {
      console.warn(
        `Failed to place theme room: ${room.id || room.constructor.name}`
      );

      return false;
    }

    const placement =
      placementOptions[randomInt(0, placementOptions.length - 1)];

    return this.executeRoomPlacement(room, placement);
  }

  executeRoomPlacement(room, placement) {
    room.setX(placement.x);
    room.setY(placement.y);
    this.rooms.push(room);
    this.addRoomToGrid(room);

    // Create doors between rooms - the placement object IS the door info
    this.createDoorConnection(placement);

    console.log(
      `Placed room at (${placement.x}, ${placement.y}): ${room.id || room.constructor.name}`
    );

    return true;
  }

  placeSpawnRoom(room) {
    // Place spawn room in a good central location
    const centerX = Math.floor(this.width * 0.3); // Slightly off-center for better connections
    const centerY = Math.floor(this.height * 0.5 - room.height / 2);

    if (this.canPlaceRoomAt(room, centerX, centerY)) {
      room.setX(centerX);
      room.setY(centerY);
      this.rooms.push(room);
      this.addRoomToGrid(room);

      if (room.isSpawn || room.id === 'spawn') {
        this.spawnRoom = room;
      }

      console.log(`Placed spawn room at (${centerX}, ${centerY})`);

      return true;
    }

    console.error('Failed to place spawn room at calculated position');

    return false;
  }

  findValidPlacements(room, relaxed = false) {
    // Use the existing door placement logic but with section-specific constraints
    const placements = getPossibleDoorPositions(
      room,
      this.rooms,
      this.height,
      this.width
    );

    // Filter placements based on section-specific rules
    return placements.filter(placement => {
      if (relaxed && this.isRequiredRoom(room)) {
        // For required rooms with relaxed validation, only check basic constraints
        return this.validateBasicPlacement(room, placement);
      } else {
        // Normal validation
        return this.validateSectionPlacement(room, placement);
      }
    });
  }

  findAnyValidPlacement(room) {
    // Emergency fallback: find ANY position where the room can connect
    const placements = getPossibleDoorPositions(
      room,
      this.rooms,
      this.height,
      this.width
    );

    // Only check for basic overlap and bounds - no theme restrictions
    return placements.filter(
      placement =>
        this.checkBounds(room, placement.x, placement.y) &&
        this.checkOverlaps(room, placement.x, placement.y)
    );
  }

  validateBasicPlacement(room, placement) {
    // Basic validation without theme-specific restrictions
    return (
      this.checkBounds(room, placement.x, placement.y) &&
      this.checkOverlaps(room, placement.x, placement.y)
    );
  }

  validateSectionPlacement(room, placement) {
    // Section-specific placement validation

    // Neural interface should be placed away from spawn but accessible
    if (room.id === 'neuralInterface') {
      if (!this.spawnRoom) return true; // No spawn room yet, allow placement

      const distanceFromSpawn =
        Math.abs(placement.x - this.spawnRoom.x) +
        Math.abs(placement.y - this.spawnRoom.y);

      // Scale distance requirements based on section size, but be more lenient
      const sectionSize = Math.min(this.width, this.height);
      const minDistance = Math.max(5, Math.floor(sectionSize * 0.1)); // Only 10% of section size minimum
      const maxDistance = Math.floor(sectionSize * 0.9); // Allow up to 90% of section size

      console.log(
        `Neural interface placement: distance=${distanceFromSpawn}, min=${minDistance}, max=${maxDistance}`
      );

      return (
        distanceFromSpawn >= minDistance && distanceFromSpawn <= maxDistance
      );
    }

    // Ship complete room (final room) - very lenient placement
    if (room.id === 'shipComplete') {
      // Just needs to be reachable, no special constraints
      return true;
    }

    // Theme-specific rules (only for non-required rooms)
    if (!this.isRequiredRoom(room)) {
      switch (this.sectionDef.theme) {
        case 'industrial':
          return this.validateIndustrialPlacement(room, placement);
        case 'medical':
          return this.validateMedicalPlacement(room, placement);
        case 'residential':
          return this.validateResidentialPlacement(room, placement);
        case 'command':
          return this.validateCommandPlacement(room, placement);
        case 'nexus':
          return this.validateNexusPlacement(room, placement);
      }
    }

    // Default: allow placement
    return true;
  }

  validateIndustrialPlacement(room, placement) {
    // Industrial rooms should be clustered together
    if (room.id === 'aiCore') {
      // AI core should be central but protected
      const centerDistance =
        Math.abs(placement.x - this.width / 2) +
        Math.abs(placement.y - this.height / 2);

      return centerDistance < this.width * 0.3;
    }

    return true;
  }

  validateMedicalPlacement(room, placement) {
    // Medical rooms should have good access patterns
    if (room.id === 'quarantineBay') {
      // Quarantine should be somewhat isolated
      const edgeDistance = Math.min(
        placement.x,
        placement.y,
        this.width - placement.x,
        this.height - placement.y
      );

      return edgeDistance < 10; // Close to edges
    }

    return true;
  }

  validateResidentialPlacement(room, placement) {
    // Residential areas should be clustered
    if (room.id === 'crewQuarters') {
      // Crew quarters should be near other residential rooms
      const nearbyResidential = this.rooms.filter(
        r =>
          r.sectionType === 'residential' &&
          Math.abs(r.x - placement.x) + Math.abs(r.y - placement.y) < 20
      );

      return nearbyResidential.length === 0 || nearbyResidential.length < 3; // Don't overcrowd
    }

    return true;
  }

  validateCommandPlacement(room, placement) {
    // Command rooms should be centrally located and secure
    const centerDistance =
      Math.abs(placement.x - this.width / 2) +
      Math.abs(placement.y - this.height / 2);

    return centerDistance < this.width * 0.4;
  }

  validateNexusPlacement(room, placement) {
    // Nexus rooms should follow a specific pattern
    if (room.id === 'centralCore') {
      // Central core must be dead center
      const centerX = Math.floor(this.width / 2);
      const centerY = Math.floor(this.height / 2);

      return (
        Math.abs(placement.x - centerX) < 5 &&
        Math.abs(placement.y - centerY) < 5
      );
    }

    return true;
  }

  canPlaceRoomAt(room, x, y) {
    return this.checkBounds(room, x, y) && this.checkOverlaps(room, x, y);
  }

  checkBounds(room, x, y) {
    return (
      x >= 0 &&
      y >= 0 &&
      x + room.width <= this.width &&
      y + room.height <= this.height
    );
  }

  checkOverlaps(room, x, y) {
    const proposedBounds = { x, y, width: room.width, height: room.height };

    return !this.rooms.some(existingRoom =>
      this.roomsOverlap(proposedBounds, existingRoom)
    );
  }

  roomsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  addRoomToGrid(room) {
    // Set floor tiles for the room and place boundary walls
    for (let y = room.y; y < room.y + room.height; y++) {
      if (!this.tiles[y]) {
        this.tiles[y] = [];
      }

      for (let x = room.x; x < room.x + room.width; x++) {
        if (!this.tiles[y][x] || this.tiles[y][x] instanceof Floor) {
          this.tiles[y][x] = new Floor(x, y);
        }

        // Place walls on room boundaries
        if (x === room.x) {
          this.tiles[y][x].setSlot('left', new WallSegment(x, y, 'left'));
        }

        if (x === room.x + room.width - 1) {
          this.tiles[y][x].setSlot('right', new WallSegment(x, y, 'right'));
        }

        if (y === room.y) {
          this.tiles[y][x].setSlot('top', new WallSegment(x, y, 'top'));
        }

        if (y === room.y + room.height - 1) {
          this.tiles[y][x].setSlot('bottom', new WallSegment(x, y, 'bottom'));
        }
      }
    }

    // Add room objects to their tiles
    room.objects.forEach(obj => {
      if (this.tiles[obj.y] && this.tiles[obj.y][obj.x]) {
        this.tiles[obj.y][obj.x].object = obj;
        this.tiles[obj.y][obj.x].passable = obj.passable;
      }
    });
  }

  createDoorConnection(doorInfo) {
    // Create doors at connection points
    // The doorInfo object comes from getPossibleDoorPositions and has the structure:
    // { x, y, existingDoor: {x, y, orientation}, targetDoor: {x, y, orientation}, connectingRoom }

    const targetTile = this.getTile(
      doorInfo.targetDoor.x,
      doorInfo.targetDoor.y
    );
    const existingTile = this.getTile(
      doorInfo.existingDoor.x,
      doorInfo.existingDoor.y
    );

    if (targetTile) {
      targetTile.setSlot(
        doorInfo.targetDoor.orientation,
        new Door(
          doorInfo.targetDoor.x,
          doorInfo.targetDoor.y,
          doorInfo.targetDoor.orientation
        )
      );
      console.log(
        `Created target door at (${doorInfo.targetDoor.x}, ${doorInfo.targetDoor.y}) facing ${doorInfo.targetDoor.orientation}`
      );
    }

    if (existingTile) {
      existingTile.setSlot(
        doorInfo.existingDoor.orientation,
        new Door(
          doorInfo.existingDoor.x,
          doorInfo.existingDoor.y,
          doorInfo.existingDoor.orientation
        )
      );
      console.log(
        `Created existing door at (${doorInfo.existingDoor.x}, ${doorInfo.existingDoor.y}) facing ${doorInfo.existingDoor.orientation}`
      );
    }
  }

  // Line of sight and visibility methods (from original ShipMap)
  hasLineOfSight(fromX, fromY, toX, toY) {
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const sx = fromX < toX ? 1 : -1;
    const sy = fromY < toY ? 1 : -1;
    let err = dx - dy;

    let x = fromX;
    let y = fromY;

    while (true) {
      const tile = this.getTile(x, y);

      if (tile?.blocksLineOfSight) return false;

      if (x === toX && y === toY) break;

      const nextX = x + (2 * err > -dy ? sx : 0);
      const nextY = y + (2 * err < dx ? sy : 0);

      // Check wall slots if we're moving
      if (nextX !== x || nextY !== y) {
        const nextTile = this.getTile(nextX, nextY);

        if (nextTile) {
          if (nextX > x) {
            if (
              tile.getSlot('right')?.blocksLineOfSight ||
              nextTile.getSlot('left')?.blocksLineOfSight
            )
              return false;
          } else if (nextX < x) {
            if (
              tile.getSlot('left')?.blocksLineOfSight ||
              nextTile.getSlot('right')?.blocksLineOfSight
            )
              return false;
          }

          if (nextY > y) {
            if (
              tile.getSlot('bottom')?.blocksLineOfSight ||
              nextTile.getSlot('top')?.blocksLineOfSight
            )
              return false;
          } else if (nextY < y) {
            if (
              tile.getSlot('top')?.blocksLineOfSight ||
              nextTile.getSlot('bottom')?.blocksLineOfSight
            )
              return false;
          }
        }
      }

      // Update error and coordinates
      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }

      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  revealAreaAroundPlayer(x, y, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (this.hasLineOfSight(x, y, nx, ny)) {
            const tile = this.getTile(nx, ny);

            if (tile) {
              tile.visible = true;
            }
          }
        }
      }
    }
  }

  // Section-specific methods
  getSectionInfo() {
    return {
      id: this.sectionDef.id,
      name: this.sectionDef.name,
      theme: this.sectionDef.theme,
      description: this.sectionDef.description,
    };
  }

  getCompletionProgress() {
    // Calculate section completion based on story discoveries, room exploration, etc.
    let totalTiles = 0;
    let visibleTiles = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);

        if (tile && this.isTileInRoom(x, y)) {
          totalTiles++;
          if (tile.visible) {
            visibleTiles++;
          }
        }
      }
    }

    const explorationProgress =
      totalTiles > 0 ? (visibleTiles / totalTiles) * 100 : 0;

    // TODO: Add story completion tracking
    // const storyProgress = this.calculateStoryProgress();

    return {
      exploration: Math.round(explorationProgress),
      // story: Math.round(storyProgress),
      overall: Math.round(explorationProgress), // For now, just exploration
    };
  }

  isTileInRoom(x, y) {
    return this.rooms.some(
      room =>
        x >= room.x &&
        x < room.x + room.width &&
        y >= room.y &&
        y < room.y + room.height
    );
  }

  getSpawnPoint() {
    if (this.spawnRoom) {
      return {
        x: Math.floor(this.spawnRoom.x + this.spawnRoom.width / 2),
        y: Math.floor(this.spawnRoom.y + this.spawnRoom.height / 2),
      };
    }

    // Fallback to center of section
    return {
      x: Math.floor(this.width / 2),
      y: Math.floor(this.height / 2),
    };
  }

  getNeuralInterfacePosition() {
    const neuralInterface = this.rooms.find(
      room =>
        room.id === 'neuralInterface' ||
        room.objects.some(obj => obj.objectType === 'neuralInterface')
    );

    if (neuralInterface) {
      return {
        x: Math.floor(neuralInterface.x + neuralInterface.width / 2),
        y: Math.floor(neuralInterface.y + neuralInterface.height / 2),
      };
    }

    return null;
  }

  getSaveState() {
    const bounds = this.findSectionBounds();
    const tiles = [];

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const tile = this.getTile(x, y);

        if (
          tile &&
          (tile.visible || tile.explored || tile.object || this.hasWalls(tile))
        ) {
          tiles.push({
            x: x,
            y: y,
            tileType: tile.type || 'floor',
            visible: tile.visible || false,
            explored: tile.explored || false,
            passable: tile.passable !== undefined ? tile.passable : true,
            object: tile.object ? this.serializeObject(tile.object) : null,
            walls: this.serializeWalls(tile),
          });
        }
      }
    }

    return {
      width: this.width,
      height: this.height,
      sectionId: this.sectionDef?.id,
      sectionTheme: this.sectionDef?.theme,
      sectionName: this.sectionDef?.name,
      bounds,
      tiles,
      rooms: this.rooms
        ? this.rooms.map(room => ({
            id: room.id,
            name: room.name,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            sectionType: room.sectionType,
            visited: room.visited || false,
            explored: room.explored || false,
          }))
        : [],
    };
  }

  findSectionBounds() {
    let minX = this.width,
      maxX = 0,
      minY = this.height,
      maxY = 0;
    let foundTiles = false;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);

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

    // Add padding
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

  async restoreFromSave(sectionData) {
    console.log('Restoring SectionMap from save data');

    // Restore basic properties
    this.width = sectionData.width || this.width;
    this.height = sectionData.height || this.height;
    this.sectionDef = {
      id: sectionData.sectionId || this.sectionDef?.id,
      name: sectionData.sectionName || this.sectionDef?.name,
      theme: sectionData.sectionTheme || this.sectionDef?.theme,
    };

    // Restore rooms
    if (sectionData.rooms) {
      this.rooms = sectionData.rooms.map(roomData => ({
        ...roomData,
        visited: roomData.visited || false,
        explored: roomData.explored || false,
      }));
    }

    // Restore tiles and their state
    if (sectionData.tiles) {
      this.tiles = [];
      for (let y = 0; y < this.height; y++) {
        this.tiles[y] = [];
        for (let x = 0; x < this.width; x++) {
          const savedTile = sectionData.tiles.find(t => t.x === x && t.y === y);

          if (savedTile) {
            // Import the appropriate tile class
            const { SectionTile } = await import('./section-tile.js');
            const tile = new SectionTile(x, y, savedTile.tileType || 'floor');

            // Restore tile properties
            tile.visible = savedTile.visible || false;
            tile.explored = savedTile.explored || false;
            tile.passable =
              savedTile.passable !== undefined ? savedTile.passable : true;

            // Restore walls
            if (savedTile.walls) {
              tile.slots = {};
              for (const [side, wallData] of Object.entries(savedTile.walls)) {
                // You'll need to restore the actual wall objects here
                // For now, just store the data
                tile.slots[side] = wallData;
              }
            }

            // Restore objects on the tile
            if (savedTile.object) {
              try {
                const { gameObjectLoader } = await import(
                  '../../entities/objects/game-object-loader.js'
                );

                tile.object = await gameObjectLoader.createObject(
                  savedTile.object.type,
                  x,
                  y,
                  savedTile.object
                );

                // Restore object state
                if (tile.object && tile.object.restoreStoryState) {
                  tile.object.restoreStoryState(savedTile.object.storyData);
                }
              } catch (error) {
                console.warn(`Failed to restore object at ${x},${y}:`, error);
              }
            }

            this.tiles[y][x] = tile;
          }
        }
      }
    }

    console.log('SectionMap restoration complete');
  }
}
