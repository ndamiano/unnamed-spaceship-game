import { BaseRoom } from "./BaseRoom.js";
import Teleporter from "../objects/Teleporter.js";

export class FinishRoom extends BaseRoom {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.addObject(
      new Teleporter(0, 0),
      Math.floor(this.width / 2),
      Math.floor(this.height / 2)
    );
  }
}
