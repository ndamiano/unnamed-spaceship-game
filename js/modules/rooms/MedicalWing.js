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
    this.addPotentialDoor(this.width, 2);
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(-1, 2);
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(2, -1);
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(2, this.height);

    // Add medical wing objects
    this.addObject(new AutoDocUnit(), 1, 1);
    this.addObject(new QuarantineChamber(), 3, 1);
    this.addObject(new HygienePod(), 1, 3);
    this.addObject(new BioScanner(), 3, 3);
    this.addObject(new WasteReprocessor(), 2, 2);
  }
}
