import { BaseRoom } from "./BaseRoom.js";
import {
  CryogenicTube,
  BioScanner,
  NutrientDispenser,
  AccessPanel,
  LogRecorder,
} from "../objects/index.js";

export class CryoChamber extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 6;
    this.height = 6;

    // Add cryo chamber objects
    this.addObject(new CryogenicTube(), 1, 1);
    this.addObject(new BioScanner(), 3, 1);
    this.addObject(new NutrientDispenser(), 1, 3);
    this.addObject(new AccessPanel(), 3, 3);
    this.addObject(new LogRecorder(), 2, 2);
  }
}
