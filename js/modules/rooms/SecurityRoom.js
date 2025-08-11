import { BaseRoom } from "./BaseRoom.js";
import SecurityTerminal from "../objects/SecurityTerminal.js";
import CombatDroidCradle from "../objects/CombatDroidCradle.js";
import PowerCell from "../objects/PowerCell.js";
import ObservationDeck from "../objects/ObservationDeck.js";
import Terminal from "../objects/Terminal.js";

export class SecurityRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 6;

    this.addPotentialDoor(2, 0, "top");
    this.addPotentialDoor(2, this.height - 1, "bottom");
    this.addPotentialDoor(0, 1, "left");
    this.addPotentialDoor(0, 2, "left");
    this.addPotentialDoor(0, 3, "left");
    this.addPotentialDoor(this.width - 1, 1, "right");
    this.addPotentialDoor(this.width - 1, 2, "right");
    this.addPotentialDoor(this.width - 1, 3, "right");

    // Observation Deck on the top row
    this.addObject(new ObservationDeck(), 0, 0);
    this.addObject(new ObservationDeck(), 4, 0);

    // Security Terminal gets system diagnostics or personal logs
    this.addObject(new SecurityTerminal(0, 0, "PERSONAL_LOGS"), 2, 2);

    // Droid cradle and backup power
    this.addObject(new CombatDroidCradle(), 1, 4);
    this.addObject(new CombatDroidCradle().flip(), 3, 4);
    this.addObject(new PowerCell(), 3, 5);
    
    // Add a terminal for security logs
    this.addObject(new Terminal(0, 0, "SYSTEM_DIAGNOSTICS"), 1, 1);
  }
}
