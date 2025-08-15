import { randomInt, getPossibleDoorPositions } from '../../utils/index.js';
import { RoomQueue } from './room-queue.js';
import { Floor } from '../tiles/floor.js';
import { WallSegment } from '../tiles/wall-segment.js';
import { Door } from '../tiles/door.js';
import { eventBus } from '../../core/event-bus.js';

class ShipMap {
  constructor(width, height, type) {
    this.width = width;
    this.height = height;
    this.type = type;
    this.tiles = this.createEmptyGrid();
    this.rooms = [];

    // Setup event listeners
    eventBus.on('player-updated', player => {
      this.revealAreaAroundPlayer(player.x, player.y, 2);
    });

    this.generateLayout();
  }

  createEmptyGrid() {
    return Array.from({ length: this.height + 1 }, (_, y) =>
      Array.from({ length: this.width + 1 }, (_, x) => new Floor(x, y))
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

  generateLayout() {
    const maxRooms = 25;
    const roomQueue = new RoomQueue(this.type, maxRooms);

    let nextRoom = roomQueue.getNextRoom();

    while (nextRoom != null) {
      this.placeRoom(nextRoom);
      nextRoom = roomQueue.getNextRoom();
    }
  }

  _addRoomToMap(room) {
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
      if (!this.tiles[obj.y]) {
        this.tiles[obj.y] = [];
      }

      this.tiles[obj.y][obj.x].object = obj;
      this.tiles[obj.y][obj.x].passable = obj.passable;
    });
  }

  placeRoom(room) {
    // Find best position for the room
    if (this.rooms.length === 0) {
      // First room (spawn room)
      room.setX(Math.floor(this.width * 0.2));
      room.setY(Math.floor(this.height * 0.5 - room.height / 2));
      this.rooms.push(room);

      this._addRoomToMap(room);
      this.spawnRoom = room;

      return room;
    }

    // For other rooms, find a connecting position
    const details = getPossibleDoorPositions(
      room,
      this.rooms,
      this.height,
      this.width
    );

    if (details.length > 0) {
      const roomPositions = details[randomInt(0, details.length - 1)];

      room.setX(roomPositions.x);
      room.setY(roomPositions.y);
      this.rooms.push(room);

      this._addRoomToMap(room);
      let tile = this.getTile(
        roomPositions.targetDoor.x,
        roomPositions.targetDoor.y
      );

      tile.setSlot(
        roomPositions.targetDoor.orientation,
        new Door(
          roomPositions.targetDoor.x,
          roomPositions.targetDoor.y,
          roomPositions.targetDoor.orientation
        )
      );
      tile = this.getTile(
        roomPositions.existingDoor.x,
        roomPositions.existingDoor.y
      );
      tile.setSlot(
        roomPositions.existingDoor.orientation,
        new Door(
          roomPositions.existingDoor.x,
          roomPositions.existingDoor.y,
          roomPositions.existingDoor.orientation
        )
      );

      return room;
    }

    return null;
  }

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

      // Only check wall slots if we're not already at the final tile
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
}

export { ShipMap };
