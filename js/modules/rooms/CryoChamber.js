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

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width, 2);
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(-1, 2);
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(2, -1);
    // Top Walls (positive x to go right, this.height)
    this.addPotentialDoor(2, this.height);

    // Add cryo chamber objects
    this.addObject(new CryogenicTube(), 1, 1);
    this.addObject(new BioScanner(), 3, 1);
    this.addObject(new NutrientDispenser(), 1, 3);
    this.addObject(new AccessPanel(), 3, 3);
    this.addObject(new LogRecorder(), 2, 2);
  }
}
