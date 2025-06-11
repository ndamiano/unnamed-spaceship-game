import { randomInt } from "./Utils.js";
import { MedicalRoom } from "./rooms/MedicalRoom.js";
import { SpawnRoom, FinishRoom, BaseRoom } from "./rooms/index.js";

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
    this.queue.push(new SpawnRoom(0, 0, 8, 6));

    // Add the normal rooms
    for (let i = 0; i < this.maxSize; i++) {
      this.addStandardRoom();
    }

    // Add the finish
    this.queue.push(new FinishRoom(0, 0, 5, 4));
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
    const rand = Math.random();
    if (rand < 0.5) {
      this.queue.push(new BaseRoom(0, 0, randomInt(4, 8), randomInt(4, 8)));
    } else {
      this.queue.push(new MedicalRoom(0, 0, randomInt(4, 8), randomInt(4, 8)));
    }
  }
}

export { RoomQueue };
