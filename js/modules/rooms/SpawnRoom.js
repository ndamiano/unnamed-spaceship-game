import { BaseRoom } from "./BaseRoom.js";
import Terminal from "../objects/Terminal.js";
import DronePod from "../objects/DronePod.js";
import AssemblyArm from "../objects/AssemblyArm.js";

export class SpawnRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 4;
    this.height = 4;

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width, 1);
    this.addPotentialDoor(this.width, 2);
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(-1, 1);
    this.addPotentialDoor(-1, 2);
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(1, -1);
    this.addPotentialDoor(2, -1);
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(1, this.height);
    this.addPotentialDoor(2, this.height);

    // Create objects for this room
    this.addObject(new Terminal(0, 0), 3, 0);
    this.addObject(new DronePod(0, 0), 0, 0);
    this.addObject(new AssemblyArm(0, 0), 0, 3);
    this.addObject(new AssemblyArm(0, 0).flip(), 3, 3);
  }
}
