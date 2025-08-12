import { BaseRoom } from "./BaseRoom.js";
import GameObject from "../objects/GameObject.js";

export class DroneHangarRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 7;
    this.height = 4;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    // Drone pods get system diagnostics
    this.addObject(new GameObject(0, 0, "dronePod"), 1, 1);
    this.addObject(new GameObject(0, 0, "dronePod"), 5, 1);
    this.addObject(new GameObject(0, 0, "maintenanceCrawler"), 3, 2);
    this.addObject(new GameObject(0, 0, "powerCell"), 3, 0);
    
    // Terminal gets system diagnostics
    this.addObject(new GameObject(0, 0, "terminal"), 1, 0);
  }
}
