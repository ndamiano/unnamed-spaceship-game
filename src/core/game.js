import { UserInterface } from '../ui/user-interface.js';
import { GameEvents, GameEventListeners } from './game-events.js';
import { Player } from '../entities/player/player.js';
import { InputHandler } from './input-handler.js';
import { GameConfig } from '../config/game-config.js';
import { registerPlayer } from '../entities/player/player-stats.js';
import { Ship } from '../world/ship/ship.js';
import { storySystem } from '../systems/story/story-system.js';
import { gameObjectLoader } from '../entities/objects/game-object-loader.js';

export class Game {
  constructor(
    options = {
      setupCanvas: true,
      setupShip: true,
      setupPlayer: true,
      setupInputHandling: true,
      setupMoveValidation: true,
      setupUI: true,
      setupStory: true,
      startGameLoop: true,
    }
  ) {
    this.config = GameConfig;
    this.initialized = false;
    this.saveData = null;
    this.isRestoringFromSave = false;
    this.init(options);
  }

  async init(options) {
    console.log('Initializing game...');

    try {
      // Load game data first
      console.log('Loading game configurations...');
      await gameObjectLoader.loadGameObjects();
      console.log('Game objects loaded');
      await storySystem.loadStoryFragments();
      console.log('Story fragments loaded');
      console.log('Game data loaded successfully');

      // Check if we're restoring from save data
      this.checkForSaveRestore();

      // Continue with normal initialization
      if (options.setupCanvas) {
        this.setupCanvas();
      }

      if (options.setupShip) {
        this.setupShip();
      }

      if (options.setupPlayer) {
        this.setupPlayer();
      }

      if (options.setupInputHandling) {
        this.setupInputHandling();
      }

      if (options.setupMoveValidation) {
        this.setupMoveValidation();
      }

      if (options.setupUI) {
        console.log('Setting up UI');
        this.setupUI();
      }

      if (options.setupStory) {
        this.setupStorySystem();
      }

      if (options.startGameLoop) {
        this.gameLoop();
      }

      this.initialized = true;
      console.log('Game initialization complete');

      // Emit initialization complete event
      GameEvents.Game.initialized();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showLoadingError(error);
    }
  }

  checkForSaveRestore() {
    // Check session storage for save data from start screen
    const startData = sessionStorage.getItem('gameStartData');

    if (startData) {
      try {
        const { isNewGame, saveData } = JSON.parse(startData);

        if (!isNewGame && saveData) {
          this.isRestoringFromSave = true;
          this.saveData = saveData;
          console.log('Game will restore from save data');
        }
      } catch (error) {
        console.error('Failed to parse save data:', error);
      }
    }
  }

  showLoadingError(error) {
    // Show a user-friendly error message
    document.body.innerHTML = `
      <div style="color: #ff0000; text-align: center; margin-top: 50px; font-family: monospace;">
        <h2>Game Loading Error</h2>
        <p>Failed to load game configuration.</p>
        <p>Error: ${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  setupStorySystem() {
    console.log('Story system initialized with JSON data');
    GameEvents.Game.message('Systems online... accessing memory banks...');
  }

  setupUI() {
    this.userInterface = new UserInterface(this.player);
  }

  setupInputHandling() {
    this.inputHandler = new InputHandler();
  }

  setupShip() {
    console.log('Setting up ship...');

    // Use saved ship dimensions if available
    const width = this.saveData?.ship?.width || 250;
    const height = this.saveData?.ship?.height || 250;
    const type = this.saveData?.ship?.type || 'colony';

    this.ship = new Ship(width, height, type);
    console.log(`Ship created: ${width}x${height}, type: ${type}`);
  }

  setupPlayer() {
    console.log('Setting up player...');

    // Use saved player position if available, otherwise use spawn point
    let spawnX, spawnY;

    if (
      this.saveData?.player?.x !== undefined &&
      this.saveData?.player?.y !== undefined
    ) {
      spawnX = this.saveData.player.x;
      spawnY = this.saveData.player.y;
      console.log(`Using saved player position: ${spawnX}, ${spawnY}`);
    } else {
      const spawnPoint = this.ship.getSpawnPoint();

      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      console.log(`Using default spawn point: ${spawnX}, ${spawnY}`);
    }

    this.player = new Player(spawnX, spawnY);
    registerPlayer(this.player);

    // Set initial exploration radius based on save data
    const explorationRadius = this.isRestoringFromSave ? 5 : 20;

    this.ship.revealAreaAroundPlayer(
      this.player.x,
      this.player.y,
      explorationRadius
    );

    console.log('Player setup complete');
  }

  setupMoveValidation() {
    GameEventListeners.register({
      'attempt-move': direction => {
        GameEvents.Player.directionChange(direction);
        const newX = this.player.x + direction.x;
        const newY = this.player.y + direction.y;

        if (this.ship.canMoveTo(newX, newY, direction)) {
          GameEvents.Player.move(newX, newY, direction);
        }
      },

      'attempt-interact': () => {
        const direction = this.player.direction;
        const targetX = this.player.x + direction.x;
        const targetY = this.player.y + direction.y;

        this.ship.attemptInteract(targetX, targetY);
      },
    });
  }

  gameLoop() {
    try {
      this.renderShip();
    } catch (error) {
      console.error('Error in game loop:', error);
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  renderShip() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // Calculate center of viewport
    const centerX = this.config.canvasWidth / 2;
    const centerY = this.config.canvasHeight / 2;

    // Calculate player's center position in world coordinates
    const playerCenterX = (this.player.x + 0.5) * this.config.tileSize;
    const playerCenterY = (this.player.y + 0.5) * this.config.tileSize;

    // Save context state
    this.ctx.save();

    // Move canvas origin to center, then offset by player position
    this.ctx.translate(centerX, centerY);
    this.ctx.translate(-playerCenterX, -playerCenterY);

    try {
      this.ship.render(this.ctx, this.config.tileSize);
    } catch (error) {
      console.error('Error rendering ship:', error);
    }

    // Restore context state
    this.ctx.restore();

    // Render player (always centered)
    try {
      this.player.render(this.ctx, centerX, centerY, this.config.tileSize);
    } catch (error) {
      console.error('Error rendering player:', error);
    }
  }

  setupCanvas() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('Canvas element not found');

      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Could not get 2D context');

      return;
    }

    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.canvas.style.backgroundColor = '#000';
  }

  // Get current game state for saving
  getSaveState() {
    if (!this.initialized || !this.player || !this.ship) {
      return null;
    }

    return {
      player: this.player.getSaveState
        ? this.player.getSaveState()
        : {
            x: this.player.x,
            y: this.player.y,
            battery: this.player.battery,
            maxBattery: this.player.maxBattery,
            resources: this.player.resources,
            upgrades: Array.from(this.player.upgrades.entries()),
            totalPlaytime: this.player.totalPlaytime || 0,
            spawnPoint: this.player.spawnPoint,
            direction: this.player.direction,
          },
      ship: this.ship.getSaveState(),
      story: storySystem.getSaveState(),
      gameLayer: 1, // Will be expanded for incremental features
      unlockedFeatures: ['exploration'],
    };
  }
}
