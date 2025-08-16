import { BaseRoom } from './base-room.js';
import GameObject from '../../entities/objects/game-object.js';

export class RoomFactory {
  constructor() {
    this.roomDefinitions = null;
    this.loadPromise = null;
  }

  async loadRoomDefinitions() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./src/config/room-definitions.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })
      .then(data => {
        this.roomDefinitions = data;
        console.log('Room definitions loaded successfully');

        return data;
      })
      .catch(error => {
        console.error('Failed to load room definitions:', error);
        throw error;
      });

    return this.loadPromise;
  }

  getRoomDefinitions() {
    if (!this.roomDefinitions) {
      throw new Error(
        'Room definitions not loaded yet. Call loadRoomDefinitions() first.'
      );
    }

    return this.roomDefinitions;
  }

  createRoom(roomId, x = 0, y = 0) {
    const definitions = this.getRoomDefinitions();
    const roomDef = definitions[roomId];

    if (!roomDef) {
      console.error(`Unknown room type: ${roomId}`);

      return this.createFallbackRoom(x, y);
    }

    return this.buildRoomFromDefinition(roomDef, x, y);
  }

  createFallbackRoom(x, y) {
    const room = new BaseRoom(x, y);

    room.width = 4;
    room.height = 4;
    room.addPotentialDoor(0, 2, 'left');
    room.addPotentialDoor(3, 2, 'right');
    room.addPotentialDoor(2, 0, 'top');
    room.addPotentialDoor(2, 3, 'bottom');

    return room;
  }

  buildRoomFromDefinition(roomDef, x, y) {
    const room = new BaseRoom(x, y);

    // Set basic properties
    room.width = roomDef.width;
    room.height = roomDef.height;
    room.weight = roomDef.weight || 10;
    room.name = roomDef.name;
    room.id = roomDef.id;
    room.isSpawn = roomDef.isSpawn || false;
    room.isFinish = roomDef.isFinish || false;

    // Add doors
    roomDef.doors.forEach(door => {
      room.addPotentialDoor(door.x, door.y, door.side);
    });

    // Add objects
    roomDef.objects.forEach(objDef => {
      const gameObject = new GameObject(0, 0, objDef.type);

      // Handle special properties
      if (objDef.flipped) {
        gameObject.flip();
      }

      if (objDef.guaranteed) {
        gameObject.guaranteedStory = true;
        gameObject.storyChance = 1.0;
      }

      room.addObject(gameObject, objDef.x, objDef.y);
    });

    return room;
  }

  // Get all room types with their weights (excluding spawn/finish)
  getStandardRoomTypes() {
    const definitions = this.getRoomDefinitions();

    return Object.entries(definitions)
      .filter(([_, def]) => !def.isSpawn && !def.isFinish)
      .map(([id, def]) => ({ id, weight: def.weight || 10 }));
  }

  // Get spawn room
  getSpawnRoom(x = 0, y = 0) {
    const definitions = this.getRoomDefinitions();
    const spawnDef = Object.values(definitions).find(def => def.isSpawn);

    if (!spawnDef) {
      console.error('No spawn room defined!');

      return this.createFallbackRoom(x, y);
    }

    return this.buildRoomFromDefinition(spawnDef, x, y);
  }

  // Get finish room
  getFinishRoom(x = 0, y = 0) {
    const definitions = this.getRoomDefinitions();
    const finishDef = Object.values(definitions).find(def => def.isFinish);

    if (!finishDef) {
      console.error('No finish room defined!');

      return this.createFallbackRoom(x, y);
    }

    return this.buildRoomFromDefinition(finishDef, x, y);
  }

  // Ship type variants - you can extend this for different ship types
  getRoomTypesForShip(shipType) {
    switch (shipType) {
      case 'warship':
        return this.getStandardRoomTypes().filter(room =>
          ['security', 'storage', 'aiCore', 'engineeringBay'].includes(room.id)
        );
      case 'science':
        return this.getStandardRoomTypes().filter(room =>
          [
            'researchLab',
            'xenobotany',
            'holographicsLab',
            'medicalBay',
          ].includes(room.id)
        );
      case 'colony':
      default:
        return this.getStandardRoomTypes();
    }
  }
}

// Create singleton instance
export const roomFactory = new RoomFactory();
