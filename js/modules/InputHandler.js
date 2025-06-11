import { EventBus } from "./EventBus.js";

class InputHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.directions = {
      w: { dx: 0, dy: -1 },
      a: { dx: -1, dy: 0 },
      s: { dx: 0, dy: 1 },
      d: { dx: 1, dy: 0 },
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
