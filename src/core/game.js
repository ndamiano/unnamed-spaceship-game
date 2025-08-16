import { UserInterface } from '../ui/user-interface.js';
import { GameEvents } from './game-events.js';
import { Player } from '../entities/player/player.js';
import { InputHandler } from './input-handler.js';
import { GameConfig } from '../config/game-config.js';
import { registerPlayer } from '../entities/player/player-stats.js';
import { Ship } from '../world/ship/ship.js';
import { storySystem } from '../systems/story/story-system.js';
import { gameObjectLoader } from '../entities/objects/game-object-loader.js';
import { Renderer } from '../rendering/renderer.js';

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
    this.options = options;
    this.initialized = false;
    this.saveData = null;
    this.isRestoringFromSave = false;
    this.renderer = null;
    this.lastFrameTime = 0;

    console.log('Game instance created, call init() to start initialization');
  }

  async init() {
    console.log('Initializing game...');

    try {
      console.log('Loading game configurations...');
      await gameObjectLoader.loadGameObjects();
      console.log('Game objects loaded');
      await storySystem.loadStoryFragments();
      console.log('Story fragments loaded');
      console.log('Game data loaded successfully');

      this.checkForSaveRestore();

      if (this.options.setupCanvas) {
        await this.setupRenderer();
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

      this.initialized = true;
      console.log('Game initialization complete');

      GameEvents.Game.Emit.initialized();

      if (this.options.startGameLoop) {
        this.startGameLoop();
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showLoadingError(error);
    }
  }

  checkForSaveRestore() {
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
    document.body.innerHTML = `
      <div style="color: #ff0000; text-align: center; margin-top: 50px; font-family: monospace;">
        <h2>Game Loading Error</h2>
        <p>Failed to load game configuration.</p>
        <p>Error: ${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  async setupRenderer() {
    console.log('Setting up renderer...');

    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.renderer = new Renderer(this.canvas, this.config, gameObjectLoader);

    console.log('Loading game assets...');
    const assetsLoaded = await this.renderer.loadGameAssets();

    if (!assetsLoaded) {
      throw new Error('Failed to load game assets');
    }

    console.log('Assets loaded successfully');
    this.renderer.start();
  }

  setupStorySystem() {
    console.log('Story system initialized with JSON data');
    GameEvents.Game.Emit.message('Systems online... accessing memory banks...');
  }

  setupUI() {
    this.userInterface = new UserInterface(this.player);
  }

  setupInputHandling() {
    this.inputHandler = new InputHandler();
  }

  setupShip() {
    console.log('Setting up ship...');

    const width = this.saveData?.ship?.width || 250;
    const height = this.saveData?.ship?.height || 250;
    const type = this.saveData?.ship?.type || 'colony';

    this.ship = new Ship(width, height, type);

    if (this.renderer) {
      const padding = 500;

      this.renderer.setCameraBounds(
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

    if (this.renderer) {
      // Set up camera to follow player
      const game = this;
      const followTarget = {
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
      };

      this.renderer.setFollowTarget(followTarget);
    }

    const explorationRadius = this.isRestoringFromSave ? 5 : 20;

    this.ship.revealAreaAroundPlayer(
      this.player.x,
      this.player.y,
      explorationRadius
    );

    console.log('Player setup complete');
  }

  setupMoveValidation() {
    GameEvents.Player.Listeners.attemptMove(direction => {
      GameEvents.Player.Emit.directionChange(direction);
      const newX = this.player.x + direction.x;
      const newY = this.player.y + direction.y;

      if (this.ship.canMoveTo(newX, newY, direction)) {
        GameEvents.Player.Emit.move(newX, newY, direction);
      }
    });

    GameEvents.Player.Listeners.attemptInteract(() => {
      const direction = this.player.direction;
      const targetX = this.player.x + direction.x;
      const targetY = this.player.y + direction.y;

      this.ship.attemptInteract(targetX, targetY);
    });

    GameEvents.Player.Listeners.move(() => {
      // Update visible tiles when player moves
      this.ship.revealAreaAroundPlayer(this.player.x, this.player.y, 2);
    });
  }

  startGameLoop() {
    console.log('Starting game loop...');
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.initialized || !this.config || !this.renderer) {
      console.warn('Game loop called before initialization complete');

      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    this.lastFrameTime = currentTime;

    try {
      this.updateGame(deltaTime);

      // Render call
      this.renderer.render(this.ship, this.player, deltaTime);
    } catch (error) {
      console.error('Error in game loop:', error);
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  updateGame(_deltaTime) {
    // Game logic updates go here
  }

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
      gameLayer: 1,
      unlockedFeatures: ['exploration'],
    };
  }
}
