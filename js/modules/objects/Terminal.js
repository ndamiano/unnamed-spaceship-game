import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";

export default class Terminal extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "terminal";
  }

  onInteract() {
    eventBus.emit("game-message", "Log stuff");
  }
}
