import { BaseRoom } from "./BaseRoom.js";
import Terminal from "../objects/Terminal.js";
import DronePod from "../objects/DronePod.js";
import AssemblyArm from "../objects/AssemblyArm.js";
import HydroponicBed from "../objects/HydroponicBed.js";

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
      this.addObject(new HydroponicBed(), x, 1);
      this.addObject(new HydroponicBed(), x, 3);
    }

    // Maintenance + control
    this.addObject(new DronePod(), 0, 0);
    this.addObject(new AssemblyArm(), 6, 0);
    this.addObject(new Terminal(), 3, 1);
  }
}
