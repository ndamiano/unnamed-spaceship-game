import { BaseRoom } from "./BaseRoom.js";
import Terminal from "../objects/Terminal.js";

export class SpawnRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 4;
    this.height = 4;

    // Create objects for this room
    this.addObject(new Terminal(0, 0), 1, 1);
  }
}
