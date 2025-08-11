import { BaseRoom } from "./BaseRoom.js";
import DronePod from "../objects/DronePod.js";
import MaintenanceCrawler from "../objects/MaintenanceCrawler.js";
import PowerCell from "../objects/PowerCell.js";
import Terminal from "../objects/Terminal.js";

export class DroneHangarRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 7;
    this.height = 4;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    // Drone pods get system diagnostics
    this.addObject(new DronePod(), 1, 1);
    this.addObject(new DronePod(), 5, 1);
    this.addObject(new MaintenanceCrawler(), 3, 2);
    this.addObject(new PowerCell(), 3, 0);
    
    // Terminal gets system diagnostics
    this.addObject(new Terminal(0, 0, "SYSTEM_DIAGNOSTICS"), 1, 0);
  }
}
