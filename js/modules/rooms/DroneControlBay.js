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

    // Add drone control bay objects
    this.addObject(new DronePod(), 1, 1);
    this.addObject(new MaintenanceCrawler(), 3, 1);
    this.addObject(new SecurityTerminal(), 1, 3);
    this.addObject(new AITetherNode(), 3, 3);
    this.addObject(new PowerCell(), 2, 2);
  }
}
