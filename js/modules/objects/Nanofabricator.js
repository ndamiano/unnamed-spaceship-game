import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";
import { RESOURCE_TYPES } from "../resources.js";
import { randomInt } from "../Utils.js";

export default class Nanofabricator extends GameObject {
  constructor(x, y) {
    super(x, y, false, false, {
      name: "nanofabricator",
      noStoryMessage: "The nanofabricator hums quietly, ready for use."
    });
    this.used = false;
  }

  onCustomInteract() {
    if (!this.used) {
      const amount = 8 + randomInt(0, 4);
      eventBus.emit("add-resource", {
        type: RESOURCE_TYPES.NANITES,
        amount: amount,
      });
      eventBus.emit("game-message", `Collected ${amount} nanites from fabricator`);
      this.used = true;
      return true; // Handled completely
    } else {
      eventBus.emit("game-message", "Nanofabricator is depleted");
      return true; // Handled completely
    }
  }

  onReset() {
    this.used = false;
  }
}