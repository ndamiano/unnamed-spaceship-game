import { BaseRoom } from "./BaseRoom.js";
import AssemblyArm from "../objects/AssemblyArm.js";
import PowerCell from "../objects/PowerCell.js";
import PlasmaConduit from "../objects/PlasmaConduit.js";
import AccessPanel from "../objects/AccessPanel.js";

export class EngineeringBayRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    this.addObject(new AssemblyArm(), 2, 1);
    this.addObject(new AssemblyArm(), 3, 1);
    this.addObject(new PlasmaConduit(), 2, 3);
    this.addObject(new PlasmaConduit(), 3, 3);
    this.addObject(new PowerCell(), 1, 2);
    this.addObject(new AccessPanel(), 4, 2);
  }
}
