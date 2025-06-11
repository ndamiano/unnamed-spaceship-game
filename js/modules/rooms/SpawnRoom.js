import { BaseRoom } from "./BaseRoom.js";
import Terminal from "../objects/Terminal.js";

export class SpawnRoom extends BaseRoom {
  constructor(x, y, width, height) {
    super(x, y, width, height);

    // Create objects for this room
    this.addObject(new Terminal(0, 0), 2, 2);
  }
}
