import { BaseRoom } from "./BaseRoom.js";
import GameObject from "../objects/GameObject.js";

export class FarmRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 7;
    this.height = 5;

    // Doors
    this.addPotentialDoor(this.width - 1, 1, "right");
    this.addPotentialDoor(this.width - 1, 2, "right");
    this.addPotentialDoor(this.width - 1, 3, "right");
    this.addPotentialDoor(0, 1, "left");
    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(0, 3, "left");
    this.addPotentialDoor(2, this.height - 1, "bottom");
    this.addPotentialDoor(3, this.height - 1, "bottom");
    this.addPotentialDoor(4, this.height - 1, "bottom");

    // Hydroponic rows
    for (let x = 1; x <= 5; x++) {
      this.addObject(new GameObject(0, 0, "hydroponicBed"), x, 1);
      this.addObject(new GameObject(0, 0, "hydroponicBed"), x, 3);
    }

    // Maintenance + control
    this.addObject(new GameObject(0, 0, "dronePod"), 0, 0);
    this.addObject(new GameObject(0, 0, "assemblyArm"), 6, 0);
    this.addObject(new GameObject(0, 0, "terminal"), 3, 1);
  }
}
