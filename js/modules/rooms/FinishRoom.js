import { BaseRoom } from "./BaseRoom.js";
import Teleporter from "../objects/Teleporter.js";

export class FinishRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 5;
    this.height = 5;
    this.addObject(
      new Teleporter(0, 0),
      Math.floor(this.width / 2),
      Math.floor(this.height / 2)
    );

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width, 2);
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(-1, 2);
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(2, -1);
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(2, this.height);
  }
}
