import { BaseRoom } from "./BaseRoom.js";
import {
  DronePod,
  MaintenanceCrawler,
  SecurityTerminal,
  AITetherNode,
  PowerCell,
} from "../objects/index.js";

export class DroneControlBay extends BaseRoom {
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

    // Add drone control bay objects
    this.addObject(new DronePod(), 1, 1);
    this.addObject(new MaintenanceCrawler(), 3, 1);
    this.addObject(new SecurityTerminal(), 1, 3);
    this.addObject(new AITetherNode(), 3, 3);
    this.addObject(new PowerCell(), 2, 2);
  }
}
