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

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width, 1);
    this.addPotentialDoor(this.width, 3);
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(-1, 1);
    this.addPotentialDoor(-1, 3);
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(3, -1);
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(3, this.height);

    // Create objects for this room
    this.addObject(new HydroponicBed(0, 0), 0, 0);
    this.addObject(new HydroponicBed(0, 0), 1, 0);
    this.addObject(new HydroponicBed(0, 0), 2, 0);
    this.addObject(new HydroponicBed(0, 0), 4, 0);
    this.addObject(new HydroponicBed(0, 0), 5, 0);
    this.addObject(new HydroponicBed(0, 0), 6, 0);
    this.addObject(new HydroponicBed(0, 0), 0, 2);
    this.addObject(new HydroponicBed(0, 0), 1, 2);
    this.addObject(new HydroponicBed(0, 0), 2, 2);
    this.addObject(new HydroponicBed(0, 0), 4, 2);
    this.addObject(new HydroponicBed(0, 0), 5, 2);
    this.addObject(new HydroponicBed(0, 0), 6, 2);
    this.addObject(new HydroponicBed(0, 0), 0, 4);
    this.addObject(new HydroponicBed(0, 0), 1, 4);
    this.addObject(new HydroponicBed(0, 0), 2, 4);
    this.addObject(new HydroponicBed(0, 0), 4, 4);
    this.addObject(new HydroponicBed(0, 0), 5, 4);
    this.addObject(new HydroponicBed(0, 0), 6, 4);
  }
}
