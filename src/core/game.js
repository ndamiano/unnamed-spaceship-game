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
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';
import { minimap } from '../ui/minimap.js';
import { initializeActiveAbilitiesHotbar } from '../ui/active-abilities-hotbar.js';
import { initializePassiveEquipmentModal } from '../ui/passive-equipment-modal.js';
import { getStats } from '../entities/player/player-stats.js';

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
    this.initializationSteps = new Set();

    // References for global access
    window.game = this;

    console.log(
      'Game instance created, setting up event-driven initialization'
    );
    this.setupInitializationFlow();
  }

  setupInitializationFlow() {
    // Set up the initialization dependency chain using events

    // Data loading happens first and triggers renderer setup
    if (this.options.setupCanvas) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        this.setupRenderer();
      });
    }

    // Ship setup depends on data being loaded
    if (this.options.setupShip) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        this.setupShip();
      });
    }

    // Player setup depends on ship being ready
    if (this.options.setupPlayer) {
      GameEvents.Initialization.Listeners.shipInitialized(() => {
        this.setupPlayer();
      });
    }

    // Input handling depends on player being ready
    if (this.options.setupInputHandling) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        this.setupInputHandling();
      });
    }

    // Move validation depends on both ship and player being ready
    if (this.options.setupMoveValidation) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        if (this.initializationSteps.has('ship')) {
          this.setupMoveValidation();
        } else {
          // Wait for ship if it's not ready yet
          GameEvents.Initialization.Listeners.shipInitialized(() => {
            this.setupMoveValidation();
          });
        }
      });
    }

    // UI depends on player being ready
    if (this.options.setupUI) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        this.setupUI();
      });
    }

    // Story system depends on data being loaded
    if (this.options.setupStory) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        this.setupStorySystem();
      });
    }

    // Game loop depends on all core systems being ready
    if (this.options.startGameLoop) {
      GameEvents.Initialization.Listeners.allSystemsReady(() => {
        this.startGameLoop();
      });
    }

    // Monitor when all systems are ready
    this.setupCompletionMonitoring();
  }

  setupCompletionMonitoring() {
    const checkAllSystemsReady = () => {
      const requiredSystems = [];

      if (this.options.setupCanvas) requiredSystems.push('renderer');
      if (this.options.setupShip) requiredSystems.push('ship');
      if (this.options.setupPlayer) requiredSystems.push('player');
      if (this.options.setupInputHandling) requiredSystems.push('input');
      if (this.options.setupMoveValidation)
        requiredSystems.push('moveValidation');
      if (this.options.setupUI) requiredSystems.push('ui');
      if (this.options.setupStory) requiredSystems.push('story');

      const allReady = requiredSystems.every(system =>
        this.initializationSteps.has(system)
      );

      if (allReady && !this.initialized) {
        this.initialized = true;
        console.log('All systems initialized successfully');

        // Initialize upgrade features after all systems are ready
        this.initializeUpgradeFeatures();

        GameEvents.Initialization.Emit.allSystemsReady();
        GameEvents.Game.Emit.initialized();
      }
    };

    // Listen to all completion events
    GameEvents.Initialization.Listeners.rendererReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.shipInitialized(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.playerReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.inputReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.uiReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.storyReady(checkAllSystemsReady);
  }

  async init() {
    console.log('Starting event-driven initialization...');

    try {
      this.checkForSaveRestore();
      await this.loadGameData();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showLoadingError(error);
    }
  }

  async loadGameData() {
    console.log('Loading game configurations...');

    try {
      await gameObjectLoader.loadGameObjects();
      console.log('Game objects loaded');

      await storySystem.loadStoryFragments();
      console.log('Story fragments loaded');

      await UpgradeSystem.initialize();
      console.log(
        'Game data loaded successfully - triggering dependent systems'
      );
      GameEvents.Initialization.Emit.dataLoaded();
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
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

    try {
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

      this.initializationSteps.add('renderer');
      GameEvents.Initialization.Emit.rendererReady();
    } catch (error) {
      console.error('Failed to setup renderer:', error);
      throw error;
    }
  }

  setupStorySystem() {
    console.log('Story system initialized with JSON data');
    GameEvents.Game.Emit.message('Systems online... accessing memory banks...');

    this.initializationSteps.add('story');
    GameEvents.Initialization.Emit.storyReady();
  }

  setupUI() {
    console.log('Setting up UI...');
    this.userInterface = new UserInterface(this.player);

    this.initializationSteps.add('ui');
    GameEvents.Initialization.Emit.uiReady();
  }

  setupInputHandling() {
    console.log('Setting up input handling...');
    this.inputHandler = new InputHandler();

    this.initializationSteps.add('input');
    GameEvents.Initialization.Emit.inputReady();
  }

  async setupShip() {
    console.log('Setting up ship...');

    try {
      const width = this.saveData?.ship?.width || 250;
      const height = this.saveData?.ship?.height || 250;
      const type = this.saveData?.ship?.type || 'colony';

      this.ship = new Ship(width, height, type);

      // Add upgrade features to ship (you'll need to integrate ShipEnhancements)
      this.ship.setupUpgradeFeatures = () => {
        // Setup room scanner
        GameEvents.Game.Listeners.revealCurrentRoom(() => {
          const playerStats = getStats();

          if (playerStats.getUpgradeCount('ROOM_SCANNER') > 0) {
            this.ship.revealCurrentRoom(playerStats.x, playerStats.y);
          }
        });

        // Setup fabricator refresh
        GameEvents.Game.Listeners.refreshNearestFabricator(() => {
          const playerStats = getStats();

          this.ship.refreshNearestFabricator(playerStats.x, playerStats.y);
        });
      };

      // Add the enhancement methods to ship
      this.addShipEnhancements();

      // Wait for the ship generation to complete
      await this.ship.map.generateLayout();

      // Setup upgrade features
      this.ship.setupUpgradeFeatures();

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

      this.initializationSteps.add('ship');
      GameEvents.Initialization.Emit.shipInitialized();
    } catch (error) {
      console.error('Failed to setup ship:', error);
      throw error;
    }
  }

  addShipEnhancements() {
    // Add room scanner functionality
    this.ship.revealCurrentRoom = (playerX, playerY) => {
      const currentRoom = this.ship.map.rooms.find(
        room =>
          playerX >= room.x &&
          playerX < room.x + room.width &&
          playerY >= room.y &&
          playerY < room.y + room.height
      );

      if (currentRoom) {
        let tilesRevealed = 0;

        for (
          let y = currentRoom.y;
          y < currentRoom.y + currentRoom.height;
          y++
        ) {
          for (
            let x = currentRoom.x;
            x < currentRoom.x + currentRoom.width;
            x++
          ) {
            const tile = this.ship.map.getTile(x, y);

            if (tile && !tile.visible) {
              tile.visible = true;
              tilesRevealed++;
            }
          }
        }

        if (tilesRevealed > 0) {
          GameEvents.Game.Emit.message(
            `Room Scanner: ${currentRoom.name || currentRoom.id} fully mapped (${tilesRevealed} new areas)`
          );
        }
      }
    };

    // Add fabricator refresh functionality
    this.ship.refreshNearestFabricator = (playerX, playerY) => {
      let nearestFabricator = null;
      let nearestDistance = Infinity;
      let fabricatorPos = null;

      for (let y = 0; y < this.ship.height; y++) {
        for (let x = 0; x < this.ship.width; x++) {
          const tile = this.ship.map.getTile(x, y);

          if (
            tile &&
            tile.object &&
            tile.object.objectType === 'nanofabricator'
          ) {
            const distance = Math.abs(x - playerX) + Math.abs(y - playerY);

            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestFabricator = tile.object;
              fabricatorPos = { x, y };
            }
          }
        }
      }

      if (nearestFabricator && nearestDistance <= 5) {
        let refreshed = false;

        nearestFabricator.activationResults.forEach(result => {
          if (result.type === 'resource' && result.used) {
            result.used = false;
            refreshed = true;
          }
        });

        if (refreshed) {
          GameEvents.Game.Emit.message(
            `Nanofabricator at (${fabricatorPos.x}, ${fabricatorPos.y}) refreshed and ready for use`
          );
        } else {
          GameEvents.Game.Emit.message(
            'Nanofabricator was already ready for use'
          );
        }

        return true;
      } else {
        GameEvents.Game.Emit.message(
          `No nanofabricator within range (5 tiles). Nearest: ${nearestDistance} tiles away.`
        );

        return false;
      }
    };
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

    // Register player with PlayerStats BEFORE initializing event handlers
    registerPlayer(this.player);

    // Now it's safe to initialize event handlers (which may emit events)
    this.player.initializeEventHandlers();

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

    this.initializationSteps.add('player');
    GameEvents.Initialization.Emit.playerReady();
  }

  setupMoveValidation() {
    console.log('Setting up move validation...');

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

    this.initializationSteps.add('moveValidation');
  }

  initializeUpgradeFeatures() {
    console.log('Initializing upgrade features...');

    // Set up minimap references
    minimap.setReferences(this.ship, this.player);

    // Check if minimap should be enabled from save
    if (this.player.hasUpgrade('NAVIGATION_MATRIX')) {
      GameEvents.UI.Emit.enableMinimap();
    }

    // Initialize active abilities hotbar now that player is ready
    const activeAbilitiesHotbar = initializeActiveAbilitiesHotbar();

    window.activeAbilitiesHotbar = activeAbilitiesHotbar;

    // Initialize passive equipment modal
    const passiveEquipmentModal = initializePassiveEquipmentModal();

    window.passiveEquipmentModal = passiveEquipmentModal;

    // Listen for ability hotkey events
    document.addEventListener('abilityHotkey', e => {
      const abilityId = activeAbilitiesHotbar.abilities.get(e.detail.keyNumber);

      if (abilityId) {
        const result = this.player.useActiveAbility(abilityId);

        if (result.success) {
          GameEvents.Game.Emit.message(result.message);
          activeAbilitiesHotbar.refresh();
        } else if (result.message) {
          GameEvents.Game.Emit.message(`Cannot use ability: ${result.message}`);
        }
      }
    });

    console.log('Upgrade features initialized');
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
      this.renderer.render(this.ship, this.player, deltaTime);

      // Update upgrade features
      if (minimap.enabled && minimap.visible) {
        minimap.update();
      }
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
      player: this.player.getSaveState(),
      ship: this.ship.getSaveState(),
      story: storySystem.getSaveState(),
      gameLayer: 1,
      unlockedFeatures: ['exploration'],
    };
  }
}
