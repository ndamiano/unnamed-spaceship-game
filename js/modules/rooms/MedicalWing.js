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

    // Add medical wing objects
    this.addObject(new AutoDocUnit(), 1, 1);
    this.addObject(new QuarantineChamber(), 3, 1);
    this.addObject(new HygienePod(), 1, 3);
    this.addObject(new BioScanner(), 3, 3);
    this.addObject(new WasteReprocessor(), 2, 2);
  }
}
