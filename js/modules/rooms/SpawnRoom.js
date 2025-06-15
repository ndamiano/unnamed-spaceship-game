import { BaseRoom } from "./BaseRoom.js";
import Terminal from "../objects/Terminal.js";
import DronePod from "../objects/DronePod.js";
import AssemblyArm from "../objects/AssemblyArm.js";

export class SpawnRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 5;

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width - 1, 1, "right");
    this.addPotentialDoor(this.width - 1, 2, "right");
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(0, 1, "left");
    this.addPotentialDoor(0, 2, "left");
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(1, 0, "top");
    this.addPotentialDoor(2, 0, "top");
    // Bottom Walls (positive x to go right, this.height)
    this.addPotentialDoor(1, this.height - 1, "bottom");
    this.addPotentialDoor(2, this.height - 1, "bottom");

    // Create objects for this room
    this.addObject(new Terminal(0, 0), 4, 0);
    this.addObject(new DronePod(0, 0), 0, 0);
    this.addObject(new AssemblyArm(0, 0), 0, 4);
    this.addObject(new AssemblyArm(0, 0).flip(), 4, 4);
  }
}
