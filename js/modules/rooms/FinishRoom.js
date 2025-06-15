import { BaseRoom } from "./BaseRoom.js";
import Teleporter from "../objects/Teleporter.js";
import ControlPanel from "../objects/ControlPanel.js";
import EnergyPylon from "../objects/EnergyPylon.js";

export class FinishRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);
    this.width = 5;
    this.height = 5;

    // Central teleporter
    this.addObject(
      new Teleporter(0, 0),
      Math.floor(this.width / 2),
      Math.floor(this.height / 2)
    );

    // Symmetric energy pylons flanking the teleporter
    this.addObject(new EnergyPylon(), 1, 2);
    this.addObject(new EnergyPylon(), 3, 2);

    // A control panel near the bottom
    this.addObject(new ControlPanel(), 2, 1);

    // Door placements
    this.addPotentialDoor(this.width - 1, 2, "right");
    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(2, 0, "bottom");
    this.addPotentialDoor(2, this.height - 1, "top");
  }
}
