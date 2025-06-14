import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";
import { RESOURCE_TYPES } from "../resources.js";
import { randomInt } from "../Utils.js";

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
      const amount = 8 + randomInt(0, 4);
      eventBus.emit("add-resource", {
        type: RESOURCE_TYPES.NANITES,
        amount: amount,
      });
      this.used = true;
    }
  }
}
