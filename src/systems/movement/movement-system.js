// src/systems/movement/movement-system.js
import { GameEvents } from '../../core/game-events.js';

export class MovementSystem {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    console.log('Initializing movement system...');

    this.setupMoveValidation();
    this.setupInteractionHandling();
    this.setupMovementEffects();

    this.initialized = true;
  }

  setupMoveValidation() {
    GameEvents.Player.Listeners.attemptMove(direction => {
      const game = window.game;

      if (!game?.player || !game?.ship) return;

      GameEvents.Player.Emit.directionChange(direction);

      const newX = game.player.x + direction.x;
      const newY = game.player.y + direction.y;

      if (game.ship.canMoveTo(newX, newY, direction)) {
        GameEvents.Player.Emit.move(newX, newY, direction);
      }
    });
  }

  setupInteractionHandling() {
    GameEvents.Player.Listeners.attemptInteract(() => {
      const game = window.game;

      if (!game?.player || !game?.ship) return;

      const direction = game.player.direction;
      const targetX = game.player.x + direction.x;
      const targetY = game.player.y + direction.y;

      game.ship.attemptInteract(targetX, targetY);
    });
  }

  setupMovementEffects() {
    GameEvents.Player.Listeners.move(() => {
      const game = window.game;

      if (!game?.player || !game?.ship) return;
      const explorationRadius = game.player.explorationRadius;

      game.ship.revealAreaAroundPlayer(
        game.player.x,
        game.player.y,
        explorationRadius
      );
    });
  }

  isInitialized() {
    return this.initialized;
  }
}
