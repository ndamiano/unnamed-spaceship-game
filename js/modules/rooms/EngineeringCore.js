import { BaseRoom } from "./BaseRoom.js";
import {
  PlasmaConduit,
  GravityStabilizer,
  Nanofabricator,
  PowerCell,
  AssemblyArm,
} from "../objects/index.js";

export class EngineeringCore extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 8;
    this.height = 8;

    // Add engineering core objects
    this.addObject(new PlasmaConduit(), 1, 1);
    this.addObject(new GravityStabilizer(), 3, 1);
    this.addObject(new Nanofabricator(), 1, 3);
    this.addObject(new PowerCell(), 3, 3);
    this.addObject(new AssemblyArm(), 2, 2);
  }
}
