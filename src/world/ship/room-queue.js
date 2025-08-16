import { roomFactory } from '../rooms/room-factory.js';

export class RoomQueue {
  constructor(shipType = 'colony', maxSize = 25) {
    this.queue = [];
    this.shipType = shipType;
    this.maxSize = maxSize;
    this.roomTypes = [];
  }

  async initialize() {
    // Load room definitions
    await roomFactory.loadRoomDefinitions();

    // Get room types for this ship type
    this.roomTypes = roomFactory.getRoomTypesForShip(this.shipType);

    // Always start with spawn room
    this.queue.push(roomFactory.getSpawnRoom(0, 0));

    // Add the normal rooms
    for (let i = 0; i < this.maxSize; i++) {
      this.addStandardRoom();
    }

    // Add the finish
    this.queue.push(roomFactory.getFinishRoom(0, 0));
  }

  getNextRoom() {
    if (this.queue.length > 0) {
      return this.queue.shift();
    }

    return null;
  }

  addStandardRoom() {
    const roomType = this.getWeightedRoomType();
    const room = roomFactory.createRoom(roomType, 0, 0);

    this.queue.push(room);
  }

  getWeightedRoomType() {
    const totalWeight = this.roomTypes.reduce(
      (sum, room) => sum + room.weight,
      0
    );
    const random = Math.random() * totalWeight;
    let weightSum = 0;

    for (const roomType of this.roomTypes) {
      weightSum += roomType.weight;
      if (random <= weightSum) {
        return roomType.id;
      }
    }

    return this.roomTypes[0]?.id || 'storage'; // fallback
  }
}
