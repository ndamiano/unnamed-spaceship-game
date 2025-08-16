// src/core/game.js
import { UserInterface } from '../ui/user-interface.js';
import { GameEvents, GameEventListeners } from './game-events.js';
import { Player } from '../entities/player/player.js';
import { InputHandler } from './input-handler.js';
import { GameConfig } from '../config/game-config.js';
import { registerPlayer } from '../entities/player/player-stats.js';
import { Ship } from '../world/ship/ship.js';
import { storySystem } from '../systems/story/story-system.js';
import { gameObjectLoader } from '../entities/objects/game-object-loader.js';
import { RenderingSystem } from '../rendering/rendering-system.js';

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
    // Set config immediately in constructor
    this.config = GameConfig;
    this.options = options;
    this.initialized = false;
    this.saveData = null;
    this.isRestoringFromSave = false;
    this.renderingSystem = null;
    this.lastFrameTime = 0;

    // Don't call init() here - it should be called externally
    console.log('Game instance created, call init() to start initialization');
  }

  async init() {
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

      // Setup rendering system first (needed for other systems)
      if (this.options.setupCanvas) {
        await this.setupRenderingSystem();
      }

      if (this.options.setupShip) {
        this.setupShip();
      }

      if (this.options.setupPlayer) {
        this.setupPlayer();
      }

      if (this.options.setupInputHandling) {
        this.setupInputHandling();
      }

      if (this.options.setupMoveValidation) {
        this.setupMoveValidation();
      }

      if (this.options.setupUI) {
        console.log('Setting up UI');
        this.setupUI();
      }

      if (this.options.setupStory) {
        this.setupStorySystem();
      }

      // Mark as initialized BEFORE starting game loop
      this.initialized = true;
      console.log('Game initialization complete');

      // Emit initialization complete event
      GameEvents.Game.initialized();

      // Start game loop last
      if (this.options.startGameLoop) {
        this.startGameLoop();
      }
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

  async setupRenderingSystem() {
    console.log('Setting up rendering system...');

    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Create rendering system with gameObjectLoader for dynamic asset loading
    this.renderingSystem = new RenderingSystem(
      this.canvas,
      this.config,
      gameObjectLoader
    );

    // Load assets
    console.log('Loading game assets...');
    const assetsLoaded = await this.renderingSystem.loadAssets();

    if (!assetsLoaded) {
      throw new Error('Failed to load game assets');
    }

    console.log('Assets loaded successfully');

    // Start the rendering system
    this.renderingSystem.start();

    // Set up camera bounds based on ship size (will be set properly in setupShip)
    this.renderingSystem.setCameraBounds(-1000, -1000, 1000, 1000);
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

    // Set camera bounds based on ship size
    if (this.renderingSystem) {
      const padding = 500; // Extra space around ship

      this.renderingSystem.setCameraBounds(
        -padding,
        -padding,
        width * this.config.tileSize + padding,
        height * this.config.tileSize + padding
      );
    }

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

    // Create player renderable
    if (this.renderingSystem) {
      this.createPlayerRenderable();

      // Set up camera to follow player - fix the scope issue
      const game = this; // Capture reference to game instance

      this.renderingSystem.followTarget({
        get x() {
          return (
            game.player.x * game.config.tileSize + game.config.tileSize / 2
          );
        },
        get y() {
          return (
            game.player.y * game.config.tileSize + game.config.tileSize / 2
          );
        },
      });
    }

    // Set initial exploration radius based on save data
    const explorationRadius = this.isRestoringFromSave ? 5 : 20;

    this.ship.revealAreaAroundPlayer(
      this.player.x,
      this.player.y,
      explorationRadius
    );

    console.log('Player setup complete');
  }

  createPlayerRenderable() {
    const worldX = this.player.x * this.config.tileSize;
    const worldY = this.player.y * this.config.tileSize;

    // Create player sprite
    const playerRenderable = this.renderingSystem.createSpriteRenderable(
      worldX,
      worldY,
      'assets/player-100x100.png',
      {
        layer: 10, // Player renders on top
        width: this.config.tileSize,
        height: this.config.tileSize,
      }
    );

    this.player.renderable = playerRenderable;
    this.renderingSystem.addToScene(playerRenderable);

    // Update player renderable rotation based on initial direction
    this.updatePlayerRenderable();

    console.log('Player renderable created');
  }

  updatePlayerRenderable() {
    if (!this.player.renderable) return;

    // Update position
    const worldX = this.player.x * this.config.tileSize;
    const worldY = this.player.y * this.config.tileSize;

    this.player.renderable.setPosition(worldX, worldY);

    // Update rotation based on direction
    let rotation = 0;
    const { direction } = this.player;

    if (direction.x === 0 && direction.y === -1)
      rotation = Math.PI; // UP
    else if (direction.x === 1 && direction.y === 0)
      rotation = -Math.PI / 2; // RIGHT
    else if (direction.x === -1 && direction.y === 0) rotation = Math.PI / 2; // LEFT
    // DOWN is default (0 rotation)

    this.player.renderable.setRotation(rotation);
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

      'player-move': () => {
        // Update player renderable when player moves
        this.updatePlayerRenderable();

        // Update camera target - fix scope issue here too
        if (this.renderingSystem && this.renderingSystem.camera.followTarget) {
          const worldX =
            this.player.x * this.config.tileSize + this.config.tileSize / 2;
          const worldY =
            this.player.y * this.config.tileSize + this.config.tileSize / 2;

          // Update the target object's position
          this.renderingSystem.camera.followTarget.x = worldX;
          this.renderingSystem.camera.followTarget.y = worldY;
        }
      },

      'player-direction-change': () => {
        // Update player renderable rotation when direction changes
        this.updatePlayerRenderable();
      },
    });
  }

  startGameLoop() {
    console.log('Starting game loop...');
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    // Safety check - don't run if not initialized
    if (!this.initialized || !this.config || !this.renderingSystem) {
      console.warn('Game loop called before initialization complete');

      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    this.lastFrameTime = currentTime;

    try {
      // Update game logic here if needed
      this.updateGame(deltaTime);

      // Render everything through the rendering system
      this.renderingSystem.render(deltaTime);
    } catch (error) {
      console.error('Error in game loop:', error);
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  updateGame(_deltaTime) {
    // Game logic updates go here
    // For now, this is mostly empty since most updates are event-driven
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
