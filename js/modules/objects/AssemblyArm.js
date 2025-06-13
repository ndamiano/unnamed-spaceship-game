import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";

export default class AssemblyArm extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "assembly-arm";
  }

  onInteract() {
    eventBus.emit("game-message", "This is how you were made");
  }
}
