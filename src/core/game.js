// src/core/game.js - SIMPLIFIED VERSION
import { GameConfig } from '../config/game-config.js';
import { GameEvents } from './game-events.js';
import { InputHandler } from './input-handler.js';
import { UserInterface } from '../ui/user-interface.js';
import { gameObjectLoader } from '../entities/objects/game-object-loader.js';
import { storySystem } from '../systems/story/story-system.js';
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';
import { minimap } from '../ui/minimap.js';
import { initializeActiveAbilitiesHotbar } from '../ui/active-abilities-hotbar.js';
import { initializePassiveEquipmentModal } from '../ui/passive-equipment-modal.js';

// Import the new systems
import { RenderingSystem } from '../systems/rendering/rendering-system.js';
import { ShipSystem } from '../systems/ship/ship-system.js';
import { PlayerSystem } from '../systems/player/player-system.js';
import { MovementSystem } from '../systems/movement/movement-system.js';
import { SaveSystem } from '../systems/save/save-system.js';
import { GameLoopSystem } from '../systems/gameloop/gameloop-system.js';

export class Game {
  constructor(options = {}) {
    this.config = GameConfig;
    this.options = this.mergeDefaultOptions(options);
    this.initialized = false;
    this.systems = new Map();

    // References for backwards compatibility
    this.renderer = null;
    this.ship = null;
    this.player = null;
    this.inputHandler = null;
    this.userInterface = null;

    // Global reference
    window.game = this;

    console.log('Game instance created - setting up systems');
    this.setupSystems();
    this.setupInitializationFlow();
  }

  mergeDefaultOptions(options) {
    return {
      setupCanvas: true,
      setupShip: true,
      setupPlayer: true,
      setupInputHandling: true,
      setupMoveValidation: true,
      setupUI: true,
      setupStory: true,
      startGameLoop: true,
      ...options,
    };
  }

  setupSystems() {
    // Create all systems but don't initialize them yet
    this.systems.set('save', new SaveSystem());
    this.systems.set('rendering', new RenderingSystem(this.config));
    this.systems.set('ship', new ShipSystem());
    this.systems.set('player', new PlayerSystem());
    this.systems.set('movement', new MovementSystem());
    this.systems.set('gameloop', new GameLoopSystem());
  }

  setupInitializationFlow() {
    // Data loading triggers dependent systems
    if (this.options.setupCanvas) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        this.systems.get('rendering').initialize();
      });
    }

    if (this.options.setupShip) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        const saveData = this.systems.get('save').getSaveData();

        this.systems.get('ship').initialize(saveData?.ship);
      });
    }

    if (this.options.setupPlayer) {
      GameEvents.Initialization.Listeners.shipInitialized(() => {
        const saveData = this.systems.get('save').getSaveData();
        const ship = this.systems.get('ship').getShip();

        this.systems.get('player').initialize(ship, saveData?.player);
      });
    }

    if (this.options.setupInputHandling) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        this.setupInputHandling();
      });
    }

    if (this.options.setupMoveValidation) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        this.systems.get('movement').initialize();
      });
    }

    if (this.options.setupUI) {
      GameEvents.Initialization.Listeners.playerReady(() => {
        this.setupUI();
      });
    }

    if (this.options.setupStory) {
      GameEvents.Initialization.Listeners.dataLoaded(() => {
        this.setupStorySystem();
      });
    }

    if (this.options.startGameLoop) {
      GameEvents.Initialization.Listeners.allSystemsReady(() => {
        const renderer = this.systems.get('rendering').getRenderer();
        const ship = this.systems.get('ship').getShip();
        const player = this.systems.get('player').getPlayer();

        this.systems.get('gameloop').initialize(renderer, ship, player);
      });
    }

    this.setupCompletionMonitoring();
  }

  setupCompletionMonitoring() {
    const checkAllSystemsReady = () => {
      const requiredSystems = this.getRequiredSystems();
      const allReady = requiredSystems.every(system =>
        this.systems.get(system)?.isInitialized()
      );

      if (allReady && !this.initialized) {
        this.initialized = true;
        console.log('All systems initialized successfully');

        // Set up cross-system references for backwards compatibility
        this.updateReferences();

        // Initialize upgrade features
        this.initializeUpgradeFeatures();

        GameEvents.Initialization.Emit.allSystemsReady();
        GameEvents.Game.Emit.initialized();
      }
    };

    // Listen to all system completion events
    GameEvents.Initialization.Listeners.rendererReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.shipInitialized(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.playerReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.inputReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.uiReady(checkAllSystemsReady);
    GameEvents.Initialization.Listeners.storyReady(checkAllSystemsReady);
  }

  updateReferences() {
    // Update references for backwards compatibility
    this.renderer = this.systems.get('rendering')?.getRenderer();
    this.ship = this.systems.get('ship')?.getShip();
    this.player = this.systems.get('player')?.getPlayer();

    // Setup camera bounds now that we have renderer and ship
    if (this.renderer && this.ship) {
      this.systems
        .get('rendering')
        .setupCameraBounds(
          this.ship.width,
          this.ship.height,
          this.config.tileSize
        );
    }

    // Setup camera following now that we have renderer and player
    if (this.renderer && this.player) {
      const followTarget = {
        get x() {
          return (
            window.game.player.x * window.game.config.tileSize +
            window.game.config.tileSize / 2
          );
        },
        get y() {
          return (
            window.game.player.y * window.game.config.tileSize +
            window.game.config.tileSize / 2
          );
        },
      };

      this.systems.get('rendering').setFollowTarget(followTarget);
    }
  }

  getRequiredSystems() {
    const required = [];

    if (this.options.setupCanvas) required.push('rendering');
    if (this.options.setupShip) required.push('ship');
    if (this.options.setupPlayer) required.push('player');
    if (this.options.setupMoveValidation) required.push('movement');
    if (this.options.setupInputHandling) required.push('input');
    if (this.options.setupUI) required.push('ui');
    if (this.options.setupStory) required.push('story');

    return required;
  }

  async init() {
    console.log('Starting game initialization...');

    try {
      this.systems.get('save').checkForSaveRestore();
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
      await storySystem.loadStoryFragments();
      await UpgradeSystem.initialize();

      console.log('Game data loaded successfully');
      GameEvents.Initialization.Emit.dataLoaded();
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }

  setupStorySystem() {
    console.log('Story system initialized with JSON data');
    GameEvents.Game.Emit.message('Systems online... accessing memory banks...');

    // Mark story as initialized
    this.systems.set('story', { isInitialized: () => true });
    GameEvents.Initialization.Emit.storyReady();
  }

  setupUI() {
    console.log('Setting up UI...');
    this.userInterface = new UserInterface();

    // Mark UI as initialized
    this.systems.set('ui', { isInitialized: () => true });
    GameEvents.Initialization.Emit.uiReady();
  }

  setupInputHandling() {
    console.log('Setting up input handling...');
    this.inputHandler = new InputHandler();

    // Mark input as initialized
    this.systems.set('input', { isInitialized: () => true });
    GameEvents.Initialization.Emit.inputReady();
  }

  initializeUpgradeFeatures() {
    console.log('Initializing upgrade features...');

    // Set up minimap references
    minimap.setReferences(this.ship, this.player);

    // Check if minimap should be enabled from save
    if (this.player.hasUpgrade('NAVIGATION_MATRIX')) {
      GameEvents.UI.Emit.enableMinimap();
    }

    // Initialize active abilities hotbar
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

  getSaveState() {
    if (!this.initialized) return null;

    return {
      player: this.systems.get('player')?.getSaveState(),
      ship: this.systems.get('ship')?.getSaveState(),
      story: storySystem.getSaveState(),
      gameLayer: 1,
      unlockedFeatures: ['exploration'],
    };
  }
}
