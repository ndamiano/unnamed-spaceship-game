import { BaseRoom } from "./BaseRoom.js";
import HologramProjector from "../objects/HologramProjector.js";
import CommsRelayStation from "../objects/CommsRelayStation.js";
import Terminal from "../objects/Terminal.js";

export class HolographicsLabRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 5;

    this.addPotentialDoor(2, 0, "top");
    this.addPotentialDoor(2, this.height - 1, "bottom");

    this.addObject(new HologramProjector(), 1, 1);
    this.addObject(new HologramProjector(), 3, 1);
    this.addObject(new CommsRelayStation(), 2, 2);
    this.addObject(new Terminal(), 2, 3);
  }
}
