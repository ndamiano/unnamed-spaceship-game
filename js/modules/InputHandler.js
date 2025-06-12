import { Directions } from "./Utils.js";

class InputHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.directions = {
      w: Directions.UP,
      a: Directions.LEFT,
      s: Directions.DOWN,
      d: Directions.RIGHT,
    };
    this.setupControls();
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (this.directions[key]) {
        this.eventBus.emit("attempt-move", this.directions[key]);
      }
    });
  }
}

export { InputHandler };
