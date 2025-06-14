import GameObject from "./GameObject.js";
import { eventBus } from "../EventBus.js";

export default class Teleporter extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "teleporter";
  }
  onInteract() {
    eventBus.emit("game-message", "You win!");
  }
}
