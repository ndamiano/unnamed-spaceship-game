import { Player } from '../../entities/player/player.js';
import { GameEvents } from '../../core/game-events.js';
import { registerPlayer } from '../../entities/player/player-stats.js';

export class PlayerSystem {
  constructor() {
    this.player = null;
    this.ship = null;
    this.initialized = false;
    this.isRestoringFromSave = false;
  }

  initialize(ship, saveData = null) {
    console.log('Initializing player system...');

    this.ship = ship;
    this.isRestoringFromSave = !!saveData;

    try {
      console.log(saveData);
      const { spawnX, spawnY } = this.determineSpawnPosition(saveData);

      const properSpawnPoint = this.determineSpawnPoint(saveData);

      this.player = new Player(spawnX, spawnY);

      this.player.spawnPoint = properSpawnPoint;

      // Register player with PlayerStats BEFORE initializing event handlers
      registerPlayer(this.player);

      // Initialize event handlers (which may emit events)
      this.player.initializeEventHandlers();

      // Setup camera following
      this.setupCameraFollowing();

      // Reveal initial area
      this.revealInitialArea();

      // Show welcome story for new games only
      if (!this.isRestoringFromSave) {
        GameEvents.Story.Emit.show('AWAKENING_PROTOCOL');
      }

      console.log(`Player setup complete: ${this.player}`);

      this.initialized = true;
      GameEvents.Initialization.Emit.playerReady();
    } catch (error) {
      console.error('Failed to setup player:', error);
      throw error;
    }
  }

  determineSpawnPosition(saveData) {
    let spawnX, spawnY;

    if (saveData?.x !== undefined && saveData?.y !== undefined) {
      spawnX = saveData.x;
      spawnY = saveData.y;
      console.log(`Using saved player position: ${spawnX}, ${spawnY}`);
    } else {
      const spawnPoint = this.ship.getSpawnPoint();

      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      console.log(`Using default spawn point: ${spawnX}, ${spawnY}`);
    }

    return { spawnX, spawnY };
  }

  determineSpawnPoint(saveData) {
    if (saveData?.spawnPoint) {
      console.log(
        `Using saved spawn point: ${saveData.spawnPoint.x}, ${saveData.spawnPoint.y}`
      );

      return { ...saveData.spawnPoint };
    } else {
      const shipSpawnPoint = this.ship.getSpawnPoint();

      console.log(
        `Using ship spawn point: ${shipSpawnPoint.x}, ${shipSpawnPoint.y}`
      );

      return { ...shipSpawnPoint };
    }
  }

  setupCameraFollowing() {
    // Set up camera to follow player if rendering system is available
    if (window.game?.renderer) {
      const game = window.game;
      const followTarget = {
        get x() {
          return (
            this.player.x * game.config.tileSize + game.config.tileSize / 2
          );
        },
        get y() {
          return (
            this.player.y * game.config.tileSize + game.config.tileSize / 2
          );
        },
      };

      game.renderer.setFollowTarget(followTarget);
    }
  }

  revealInitialArea() {
    const explorationRadius = this.isRestoringFromSave ? 5 : 20;

    this.ship.revealAreaAroundPlayer(
      this.player.x,
      this.player.y,
      explorationRadius
    );
  }

  isInitialized() {
    return this.initialized;
  }

  getPlayer() {
    return this.player;
  }

  getSaveState() {
    return this.player ? this.player.getSaveState() : null;
  }
}
