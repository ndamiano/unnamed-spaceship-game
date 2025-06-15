import { BaseRoom } from "./BaseRoom.js";
import CryogenicTube from "../objects/CryogenicTube.js";
import BioScanner from "../objects/BioScanner.js";
import HygienePod from "../objects/HygienePod.js";
import LogRecorder from "../objects/LogRecorder.js";

export class CryoChamberRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(this.width - 1, 2, "right");

    // Cryo tubes lined up along top and bottom
    this.addObject(new CryogenicTube(), 1, 0);
    this.addObject(new CryogenicTube(), 2, 0);
    this.addObject(new CryogenicTube(), 3, 0);
    this.addObject(new CryogenicTube(), 4, 0);

    this.addObject(new CryogenicTube(), 1, 4);
    this.addObject(new CryogenicTube(), 2, 4);
    this.addObject(new CryogenicTube(), 3, 4);
    this.addObject(new CryogenicTube(), 4, 4);

    // BioScanner and Hygiene station
    // this.addObject(new BioScanner(), 0, 1);
    this.addObject(new HygienePod(), 0, 3);

    // Log Recorder in center back
    // this.addObject(new LogRecorder(), 3, 2);
  }
}
