import { Directions } from '../utils/directions.js';
import { eventBus } from './event-bus.js';

class InputHandler {
  constructor() {
    this.directions = {
      w: Directions.UP,
      a: Directions.LEFT,
      s: Directions.DOWN,
      d: Directions.RIGHT,
    };
    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();

      if (this.directions[key]) {
        eventBus.emit('attempt-move', this.directions[key]);
      } else if (key === 'e') {
        eventBus.emit('attempt-interact');
      }
    });
  }
}

export { InputHandler };
