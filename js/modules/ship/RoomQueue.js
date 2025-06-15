import {
  BaseRoom,
  CryoChamberRoom,
  FinishRoom,
  SpawnRoom,
  FarmRoom,
  SecurityRoom,
  DroneHangarRoom,
  EngineeringBayRoom,
  HolographicsLabRoom,
  XenobotanyRoom,
} from "../rooms/index.js";

const roomTypes = [
  { type: BaseRoom, weight: 10 },
  { type: CryoChamberRoom, weight: 10 },
  { type: SecurityRoom, weight: 10 },
  { type: DroneHangarRoom, weight: 10 },
  { type: EngineeringBayRoom, weight: 10 },
  { type: HolographicsLabRoom, weight: 10 },
  { type: XenobotanyRoom, weight: 10 },
  { type: FarmRoom, weight: 10 },
];

class RoomQueue {
  constructor(shipType = "colony", maxSize = 25) {
    this.queue = [];
    this.shipType = shipType;
    this.maxSize = maxSize;
    this.initialize();
  }

  /**
   * Initializes the queue, and fills it.
   * Currently, this is simple:
   * It adds a spawn room
   * Adds maxSize - 1 standard rooms
   * Adds a finish room
   */
  initialize() {
    // Always start with spawn room
    this.queue.push(new SpawnRoom(0, 0));

    // Add the normal rooms
    for (let i = 0; i < this.maxSize; i++) {
      this.addStandardRoom();
    }

    // Add the finish
    this.queue.push(new FinishRoom(0, 0));
  }

  /**
   * Gets the next room instance
   * @returns {BaseRoom} Room instance
   */
  getNextRoom() {
    if (this.queue.length > 0) {
      return this.queue.shift();
    }

    // Default to standard rooms after queue is exhausted
    return null;
  }

  /**
   * Adds a standard room to the queue
   */
  addStandardRoom() {
    this.queue.push(this.getWeightedRoom());
  }

  getWeightedRoom() {
    const totalWeight = roomTypes.reduce((sum, room) => sum + room.weight, 0);
    let random = Math.random() * totalWeight;
    let weightSum = 0;

    for (const room of roomTypes) {
      weightSum += room.weight;
      if (random <= weightSum) {
        return new room.type(0, 0);
      }
    }
    return new BaseRoom(0, 0); // fallback
  }
}

export { RoomQueue };
