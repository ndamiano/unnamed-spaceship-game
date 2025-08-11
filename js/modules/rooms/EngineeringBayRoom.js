import { BaseRoom } from "./BaseRoom.js";
import AssemblyArm from "../objects/AssemblyArm.js";
import PowerCell from "../objects/PowerCell.js";
import PlasmaConduit from "../objects/PlasmaConduit.js";
import AccessPanel from "../objects/AccessPanel.js";
import Terminal from "../objects/Terminal.js";

export class EngineeringBayRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    // AssemblyArms get revelation stories (major plot points)
    this.addObject(new AssemblyArm(0, 0, "REVELATION_MEMORIES"), 2, 1);
    this.addObject(new AssemblyArm(0, 0, "REVELATION_MEMORIES"), 3, 1);
    
    // Engineering equipment gets engineering logs
    this.addObject(new PlasmaConduit(), 2, 3);
    this.addObject(new PlasmaConduit(), 3, 3);
    this.addObject(new PowerCell(), 1, 2);
    this.addObject(new AccessPanel(), 4, 2);
    
    // Terminal in engineering room gets engineering stories
    this.addObject(new Terminal(0, 0, "ENGINEERING_LOGS"), 1, 1);
  }
}