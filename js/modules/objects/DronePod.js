import { eventBus } from "../EventBus.js";
import { getStats } from "../PlayerStats.js";
import GameObject from "./GameObject.js";

export default class DronePod extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "drone-pod";
  }
  onInteract() {
    eventBus.emit("open-upgrade-menu", getStats());
  }
}
