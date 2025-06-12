import { randomInt, getPossibleDoorPositions } from "./index.js";
import { SpawnRoom } from "./rooms/index.js";
import { RoomQueue } from "./RoomQueue.js";
import { Wall } from "./tiles/Wall.js";
import { Floor } from "./tiles/Floor.js";
import { Door } from "./objects/Door.js";

class ShipMap {
  constructor(width, height, type = "colony", eventBus) {
    // Initialize dimensions and properties
    this.width = width;
    this.height = height;
    this.type = type;

    // Initialize data structures
    this.tiles = this.createEmptyGrid();
    this.rooms = [];

    // Setup event listeners
    eventBus.on("player-updated", (player) => {
      this.revealAreaAroundPlayer(player.x, player.y, 2);
    });

    this.generateLayout();
  }

  getSpawnPoint() {
    const spawnRoom = this.rooms.find((room) => room instanceof SpawnRoom);
    return {
      x: Math.floor(spawnRoom.x + spawnRoom.width / 2),
      y: Math.floor(spawnRoom.y + spawnRoom.height / 2),
    };
  }

  createEmptyGrid() {
    return Array.from({ length: this.height + 1 }, (_, y) =>
      Array.from({ length: this.width + 1 }, (_, x) => new Wall(x, y))
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
    // Set floor tiles for the room
    for (let y = room.y; y < room.y + room.height; y++) {
      if (!this.tiles[y]) {
        this.tiles[y] = [];
      }
      for (let x = room.x; x < room.x + room.width; x++) {
        this.tiles[y][x] = new Floor(x, y);
      }
    }

    // Add room objects to their tiles
    room.objects.forEach((obj) => {
      if (!this.tiles[obj.y]) {
        this.tiles[obj.y] = [];
      }
      this.tiles[obj.y][obj.x] = obj;
    });

    // Add doors
    room.getDoors().forEach((door) => {
      if (!this.tiles[door.y]) {
        this.tiles[door.y] = [];
      }
      this.tiles[door.y][door.x] = door;
    });
  }

  placeRoom(room) {
    // Find best position for the room
    if (this.rooms.length === 0) {
      // First room (spawn room)
      room.setX(Math.floor(this.width * 0.1));
      room.setY(Math.floor(this.height * 0.5 - room.height / 2));
      this.rooms.push(room);

      this._addRoomToMap(room);
      this.spawnRoom = room;
      return room;
    }

    // For other rooms, find a connecting position
    const potentialDoors = getPossibleDoorPositions(
      room,
      this.rooms,
      this.height,
      this.width
    );
    if (potentialDoors.length > 0) {
      const doorPos = potentialDoors[randomInt(0, potentialDoors.length - 1)];
      room.setX(doorPos.x);
      room.setY(doorPos.y);
      this.rooms.push(room);

      // Create and add connecting door to both rooms
      const door = new Door(doorPos.doorX, doorPos.doorY);
      room.addDoor(door);
      doorPos.connectingRoom.addDoor(door);

      this._addRoomToMap(room);
      this._addRoomToMap(doorPos.connectingRoom);

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

    while (true) {
      // Stop if we reach the target position
      if (fromX === toX && fromY === toY) break;

      const tile = this.getTile(fromX, fromY);
      if (tile && tile.blocksLineOfSight) {
        return false; // Wall blocks line of sight
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        fromX += sx;
      }
      if (e2 < dx) {
        err += dx;
        fromY += sy;
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
            if (tile.type === "object") {
              this.setTile(nx, ny, {
                ...tile,
                visible: true,
              });
            } else {
              this.setTile(nx, ny, { visible: true });
            }
          }
        }
      }
    }
  }
}

export { ShipMap };
