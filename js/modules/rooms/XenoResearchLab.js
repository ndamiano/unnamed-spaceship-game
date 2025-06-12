import { BaseRoom } from "./BaseRoom.js";
import {
  XenobotanyChamber,
  GrowthVat,
  StasisPod,
  FleshweaverConsole,
  AlienArtefactContainer,
} from "../objects/index.js";

export class XenoResearchLab extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 8;
    this.height = 8;

    // Add xeno research lab objects
    this.addObject(new XenobotanyChamber(), 1, 1);
    this.addObject(new GrowthVat(), 3, 1);
    this.addObject(new StasisPod(), 1, 3);
    this.addObject(new FleshweaverConsole(), 3, 3);
    this.addObject(new AlienArtefactContainer(), 2, 2);
  }
}
