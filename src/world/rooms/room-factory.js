// src/world/rooms/room-factory.js - Add debug logging
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
        console.log('Available room types:', Object.keys(data));

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
      console.log('Available room types:', Object.keys(definitions));
      console.log('Creating fallback room instead');

      return this.createFallbackRoom(x, y, roomId);
    }

    console.log(`Creating room: ${roomId} (${roomDef.name})`);

    return this.buildRoomFromDefinition(roomDef, x, y);
  }

  createFallbackRoom(x, y, attemptedRoomId = 'unknown') {
    console.warn(
      `Creating fallback room for missing room type: ${attemptedRoomId}`
    );

    const room = new BaseRoom(x, y);

    room.width = 4;
    room.height = 4;
    room.id = `fallback_${attemptedRoomId}`;
    room.name = `Missing: ${attemptedRoomId}`;
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
      try {
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
      } catch (error) {
        console.error(
          `Failed to create object ${objDef.type} in room ${roomDef.id}:`,
          error
        );
        // Continue without this object rather than failing the whole room
      }
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

      return this.createFallbackRoom(x, y, 'spawn');
    }

    return this.buildRoomFromDefinition(spawnDef, x, y);
  }

  // Get finish room
  getFinishRoom(x = 0, y = 0) {
    const definitions = this.getRoomDefinitions();
    const finishDef = Object.values(definitions).find(def => def.isFinish);

    if (!finishDef) {
      console.error('No finish room defined!');

      return this.createFallbackRoom(x, y, 'finish');
    }

    return this.buildRoomFromDefinition(finishDef, x, y);
  }

  // Ship type variants - you can extend this for different ship types
  getRoomTypesForShip(shipType) {
    const allRoomTypes = this.getStandardRoomTypes();

    switch (shipType) {
      case 'warship':
        return allRoomTypes.filter(room =>
          ['security', 'storage', 'aiCore', 'engineeringBay'].includes(room.id)
        );
      case 'science':
        return allRoomTypes.filter(room =>
          [
            'researchLab',
            'xenobotany',
            'holographicsLab',
            'medicalBay',
          ].includes(room.id)
        );
      case 'colony':
      default:
        console.log(`Getting room types for ship type: ${shipType}`);
        console.log(
          `Available room types: ${allRoomTypes.map(r => r.id).join(', ')}`
        );

        return allRoomTypes;
    }
  }
}

// Create singleton instance
export const roomFactory = new RoomFactory();
