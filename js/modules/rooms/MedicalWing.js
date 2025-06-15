import { BaseRoom } from "./BaseRoom.js";
import {
  AutoDocUnit,
  QuarantineChamber,
  HygienePod,
  BioScanner,
  WasteReprocessor,
} from "../objects/index.js";

export class MedicalWing extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 7;
    this.height = 7;

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width - 1, 2, "right");
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(0, 2, "left");
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(2, 0, "top");
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(2, this.height - 1, "bottom");

    // Add medical wing objects
    this.addObject(new AutoDocUnit(), 1, 1);
    this.addObject(new QuarantineChamber(), 3, 1);
    this.addObject(new HygienePod(), 1, 3);
    this.addObject(new BioScanner(), 3, 3);
    this.addObject(new WasteReprocessor(), 2, 2);
  }
}
