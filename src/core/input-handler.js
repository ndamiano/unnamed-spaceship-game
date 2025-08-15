import { Directions } from '../utils/directions.js';
import { GameEvents } from './game-events.js';

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
        GameEvents.Player.attemptMove(this.directions[key]);
      } else if (key === 'e') {
        GameEvents.Player.attemptInteract();
      }
    });
  }
}

export { InputHandler };
