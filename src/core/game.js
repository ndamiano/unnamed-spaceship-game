import { UserInterface } from '../ui/user-interface.js';
import { GameEvents } from './game-events.js';
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
    this.config = GameConfig;
    this.options = options;
    this.initialized = false;
    this.saveData = null;
    this.isRestoringFromSave = false;
    this.renderingSystem = null;
    this.lastFrameTime = 0;

    this.shipRenderables = new Map();
    this.objectRenderables = new Map();

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

  async setupRenderingSystem() {
    console.log('Setting up rendering system...');

    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.renderingSystem = new RenderingSystem(
      this.canvas,
      this.config,
      gameObjectLoader
    );

    console.log('Loading game assets...');
    const assetsLoaded = await this.renderingSystem.loadAssets();

    if (!assetsLoaded) {
      throw new Error('Failed to load game assets');
    }

    console.log('Assets loaded successfully');
    this.renderingSystem.start();
    this.renderingSystem.setCameraBounds(-1000, -1000, 1000, 1000);
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

    if (this.renderingSystem) {
      const padding = 500;

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

    if (this.renderingSystem) {
      this.createPlayerRenderable();
      this.createShipRenderables();

      const game = this;

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

    const playerRenderable = this.renderingSystem.createSpriteRenderable(
      worldX,
      worldY,
      'assets/player-100x100.png',
      {
        layer: 10,
        width: this.config.tileSize,
        height: this.config.tileSize,
      }
    );

    this.player.renderable = playerRenderable;
    this.renderingSystem.addToScene(playerRenderable);
    this.updatePlayerRenderable();

    console.log('Player renderable created');
  }

  createShipRenderables() {
    console.log('Creating ship renderables...');
    this.clearShipRenderables();

    for (let y = 0; y < this.ship.height; y++) {
      for (let x = 0; x < this.ship.width; x++) {
        const tile = this.ship.map.getTile(x, y);

        if (tile && tile.visible) {
          this.createTileRenderable(tile, x, y);
        }
      }
    }
  }

  createTileRenderable(tile, x, y) {
    const worldX = x * this.config.tileSize;
    const worldY = y * this.config.tileSize;
    const tileKey = `${x},${y}`;

    const floorAsset = `assets/tile${tile.number || 1}-100x100.png`;
    const floorRenderable = this.renderingSystem.createSpriteRenderable(
      worldX,
      worldY,
      floorAsset,
      {
        layer: 0,
        width: this.config.tileSize,
        height: this.config.tileSize,
      }
    );

    this.renderingSystem.addToScene(floorRenderable);
    this.shipRenderables.set(`floor_${tileKey}`, floorRenderable);

    this.createSlotRenderables(tile, x, y);

    if (tile.object) {
      this.createObjectRenderable(tile.object, x, y);
    }
  }

  createSlotRenderables(tile, x, y) {
    const worldX = x * this.config.tileSize;
    const worldY = y * this.config.tileSize;
    const tileKey = `${x},${y}`;

    ['top', 'right', 'bottom', 'left'].forEach(side => {
      const slot = tile.getSlot(side);

      if (slot) {
        let slotRenderable;

        if (slot.constructor.name === 'WallSegment') {
          const wallColor = '#333333';
          let wallX = worldX,
            wallY = worldY,
            wallWidth,
            wallHeight;

          switch (side) {
            case 'top':
              wallWidth = this.config.tileSize;
              wallHeight = this.config.tileSize * 0.1;
              break;
            case 'bottom':
              wallY = worldY + this.config.tileSize * 0.9;
              wallWidth = this.config.tileSize;
              wallHeight = this.config.tileSize * 0.1;
              break;
            case 'left':
              wallWidth = this.config.tileSize * 0.1;
              wallHeight = this.config.tileSize;
              break;
            case 'right':
              wallX = worldX + this.config.tileSize * 0.9;
              wallWidth = this.config.tileSize * 0.1;
              wallHeight = this.config.tileSize;
              break;
          }

          slotRenderable = this.renderingSystem.createRectRenderable(
            wallX,
            wallY,
            wallWidth,
            wallHeight,
            wallColor,
            {
              layer: 2,
            }
          );
        } else if (slot.constructor.name === 'Door') {
          const doorColor = '#888888';
          let doorX = worldX,
            doorY = worldY,
            doorWidth,
            doorHeight;

          switch (side) {
            case 'top':
              doorWidth = this.config.tileSize;
              doorHeight = this.config.tileSize * 0.1;
              break;
            case 'bottom':
              doorY = worldY + this.config.tileSize * 0.9;
              doorWidth = this.config.tileSize;
              doorHeight = this.config.tileSize * 0.1;
              break;
            case 'left':
              doorWidth = this.config.tileSize * 0.1;
              doorHeight = this.config.tileSize;
              break;
            case 'right':
              doorX = worldX + this.config.tileSize * 0.9;
              doorWidth = this.config.tileSize * 0.1;
              doorHeight = this.config.tileSize;
              break;
          }

          slotRenderable = this.renderingSystem.createRectRenderable(
            doorX,
            doorY,
            doorWidth,
            doorHeight,
            doorColor,
            {
              layer: 2,
            }
          );
        }

        if (slotRenderable) {
          this.renderingSystem.addToScene(slotRenderable);
          this.shipRenderables.set(`${side}_${tileKey}`, slotRenderable);
        }
      }
    });
  }

  createObjectRenderable(object, x, y) {
    const worldX = x * this.config.tileSize;
    const worldY = y * this.config.tileSize;
    const objectKey = `${x},${y}`;

    if (object.isActivatable && object.isActivatable()) {
      console.log('In here!');
      const glowColor =
        object.hasAvailableStory && object.hasAvailableStory()
          ? '#ffffff'
          : '#035170';
      const glowRenderable = this.renderingSystem.createGlowRenderable(
        worldX + this.config.tileSize / 2,
        worldY + this.config.tileSize / 2,
        this.config.tileSize,
        glowColor,
        1
      );

      glowRenderable.layer = 4;
      glowRenderable.enablePulsing(2, 0.5, 1.5);

      this.renderingSystem.addToScene(glowRenderable);
      this.objectRenderables.set(`glow_${objectKey}`, glowRenderable);
    }

    let assetPath;

    if (object.assetPath) {
      assetPath = object.assetPath;
    } else if (object.name) {
      assetPath = `assets/${object.name}-100x100.png`;
    } else {
      assetPath = `assets/${object.objectType}-100x100.png`;
    }

    const objectRenderable = this.renderingSystem.createSpriteRenderable(
      worldX,
      worldY,
      assetPath,
      {
        layer: 5,
        width: this.config.tileSize,
        height: this.config.tileSize,
        flipX: object.flipped,
      }
    );

    this.renderingSystem.addToScene(objectRenderable);
    this.objectRenderables.set(`object_${objectKey}`, objectRenderable);
  }

  clearShipRenderables() {
    this.shipRenderables.forEach(renderable => {
      this.renderingSystem.removeFromScene(renderable);
    });
    this.shipRenderables.clear();

    this.objectRenderables.forEach(renderable => {
      this.renderingSystem.removeFromScene(renderable);
    });
    this.objectRenderables.clear();
  }

  updateVisibleTiles() {
    for (let y = 0; y < this.ship.height; y++) {
      for (let x = 0; x < this.ship.width; x++) {
        const tile = this.ship.map.getTile(x, y);
        const tileKey = `${x},${y}`;

        if (tile && tile.visible) {
          if (!this.shipRenderables.has(`floor_${tileKey}`)) {
            this.createTileRenderable(tile, x, y);
          }
        }
      }
    }
  }

  updatePlayerRenderable() {
    if (!this.player.renderable) return;

    const worldX = this.player.x * this.config.tileSize;
    const worldY = this.player.y * this.config.tileSize;

    this.player.renderable.setPosition(worldX, worldY);

    let rotation = 0;
    const { direction } = this.player;

    if (direction.x === 0 && direction.y === -1) rotation = Math.PI;
    else if (direction.x === 1 && direction.y === 0) rotation = -Math.PI / 2;
    else if (direction.x === -1 && direction.y === 0) rotation = Math.PI / 2;

    this.player.renderable.setRotation(rotation);
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
      this.updatePlayerRenderable();
      this.updateVisibleTiles();
    });

    GameEvents.Player.Listeners.directionChange(() => {
      this.updatePlayerRenderable();
    });
  }

  startGameLoop() {
    console.log('Starting game loop...');
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.initialized || !this.config || !this.renderingSystem) {
      console.warn('Game loop called before initialization complete');

      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    this.lastFrameTime = currentTime;

    try {
      this.updateGame(deltaTime);
      this.renderingSystem.render(deltaTime);
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
