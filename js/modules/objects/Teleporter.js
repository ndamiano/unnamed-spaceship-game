import GameObject from "./GameObject.js";
import { eventBus } from "../EventBus.js";

export default class Teleporter extends GameObject {
  constructor(x, y) {
    super(x, y, false, false, {
      name: "teleporter"
    });
  }

  onCustomInteract() {
    eventBus.emit("game-message", "You win!");
    return true;
  }
}