import { BaseRoom } from "./BaseRoom.js";
import CryogenicTube from "../objects/CryogenicTube.js";
import HygienePod from "../objects/HygienePod.js";
import Terminal from "../objects/Terminal.js";

export class CryoChamberRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    // All cryo tubes in this room share medical stories
    this.addObject(new CryogenicTube(), 1, 0);
    this.addObject(new CryogenicTube(), 2, 0);
    this.addObject(new CryogenicTube(), 3, 0);
    this.addObject(new CryogenicTube(), 4, 0);

    this.addObject(new CryogenicTube(), 1, 4);
    this.addObject(new CryogenicTube(), 2, 4);
    this.addObject(new CryogenicTube(), 3, 4);
    this.addObject(new CryogenicTube(), 4, 4);

    // Hygiene station might have personal logs
    this.addObject(new HygienePod(), 0, 3);
    
    // Terminal gets medical reports
    this.addObject(new Terminal(0, 0, "MEDICAL_REPORTS"), 5, 1);
  }
}

