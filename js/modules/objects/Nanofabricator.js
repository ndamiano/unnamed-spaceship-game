import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";
import { RESOURCE_TYPES } from "../resources.js";

export default class Nanofabricator extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "nanofabricator";
    this.used = false;
    eventBus.on("reset-state", () => {
      this.used = false;
    });
  }
  onInteract() {
    if (!this.used) {
      eventBus.emit(`add${RESOURCE_TYPES.NANITES}`, 1);
      this.used = true;
    }
  }
}
