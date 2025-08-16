import { Directions } from '../../utils/directions.js';
import { GameEvents, GameEventListeners } from '../../core/game-events.js';
import {
  BASE_RESOURCES,
  modifyResources,
  subtractResources,
} from '../../systems/resources/resource-manager.js';
import { getStats } from './player-stats.js';
import {
  UPGRADE_DEFS,
  UpgradeSystem,
} from '../../systems/upgrades/upgrade-system.js';

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.battery = 100;
    this.movementCost = 1;
    this.spawnPoint = { x, y };
    this.upgrades = new Map();
    this.direction = Directions.DOWN;
    this.resources = { ...BASE_RESOURCES };
    this.totalPlaytime = 0;
    this.playtimeStart = Date.now();

    // Rendering
    this.renderable = null; // Will be set by Game class

    this.registerEventHandlers();
  }

  // Remove the old render method - now handled by rendering system

  registerEventHandlers() {
    GameEventListeners.register({
      'player-move': ({ x, y, direction }) => {
        this.x = x;
        this.y = y;
        this.direction = direction;

        // Player renderable position and rotation will be updated by Game class
        // through the 'player-move' event listener in Game.js

        this.battery -= this.movementCost;
        this.updatePlaytime();
        GameEvents.Player.updated(getStats());
      },

      'player-direction-change': direction => {
        this.direction = direction;

        // Player renderable rotation will be updated by Game class
        // through the 'player-direction-change' event listener in Game.js

        GameEvents.Player.updated(this);
      },

      'player-updated': player => {
        if (player.battery <= 0) {
          GameEvents.Game.message(
            'As you feel your battery getting close to empty, you return to your charging pod.'
          );
          GameEvents.Game.resetState();
          this.reset();
        }
      },

      'purchase-upgrade': upgrade_def => {
        if (UpgradeSystem.canAffordUpgrade(upgrade_def.id, this.resources)) {
          this.resources = subtractResources(this.resources, upgrade_def.cost);
          const currentCount = this.upgrades.get(upgrade_def.id) ?? 0;

          this.upgrades.set(upgrade_def.id, currentCount + 1);
          GameEvents.Player.updated();
          GameEvents.Game.message('Upgrade purchased: ' + upgrade_def.name);
        }
      },

      'add-resource': ({ type, amount }) => {
        const toAdd = amount * this.harvestMultiplier;

        this.resources = modifyResources(this.resources, {
          [type]: toAdd,
        });
        GameEvents.Player.updated(getStats());
      },

      'restore-player-state': playerData => {
        this.restoreState(playerData);
      },
    });

    GameEvents.Player.updated(this);
  }

  interact(object) {
    if (typeof object.onInteract === 'function') {
      object.onInteract(this);
    }
  }

  get maxBattery() {
    const capacityUpgrade =
      this.upgrades.get(UPGRADE_DEFS.BATTERY_CAPACITY.id) || 0;

    return 100 + 100 * capacityUpgrade;
  }

  get harvestMultiplier() {
    const harvestMultiplier =
      this.upgrades.get(UPGRADE_DEFS.RESOURCE_HARVEST.id) || 0;

    return 1 + 0.5 * harvestMultiplier;
  }

  updatePlaytime() {
    const now = Date.now();
    const sessionTime = Math.floor((now - this.playtimeStart) / 1000);

    this.totalPlaytime += sessionTime;
    this.playtimeStart = now;
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.battery = this.maxBattery;
    this.updatePlaytime();

    // Update renderable position when resetting
    if (this.renderable) {
      // The Game class will handle this through the reset event
      // Just need to emit that we've moved
      GameEvents.Player.move(this.x, this.y, this.direction);
    }
  }

  // Save/Load functionality
  restoreState(playerData) {
    console.log('Restoring player state:', playerData);

    if (playerData.x !== undefined) this.x = playerData.x;
    if (playerData.y !== undefined) this.y = playerData.y;
    if (playerData.battery !== undefined) this.battery = playerData.battery;
    if (playerData.resources) this.resources = { ...playerData.resources };
    if (playerData.totalPlaytime) this.totalPlaytime = playerData.totalPlaytime;

    // Restore upgrades (convert from array back to Map if needed)
    if (playerData.upgrades) {
      if (Array.isArray(playerData.upgrades)) {
        // Convert from array format (used in saves)
        this.upgrades = new Map(playerData.upgrades);
      } else if (playerData.upgrades instanceof Map) {
        this.upgrades = new Map(playerData.upgrades);
      } else {
        // Handle object format
        this.upgrades = new Map(Object.entries(playerData.upgrades));
      }
    }

    // Update spawn point if provided
    if (playerData.spawnPoint) {
      this.spawnPoint = { ...playerData.spawnPoint };
    }

    // Restore direction
    if (playerData.direction) {
      this.direction = playerData.direction;
    }

    // Reset playtime tracking
    this.playtimeStart = Date.now();

    // Update renderable if it exists (during game restoration)
    if (this.renderable) {
      // Emit move event to update rendering
      GameEvents.Player.move(this.x, this.y, this.direction);
    }

    GameEvents.Player.updated(getStats());
    GameEvents.Game.message('Welcome back! Your progress has been restored.');
  }

  // Get current state for saving
  getSaveState() {
    this.updatePlaytime();

    return {
      x: this.x,
      y: this.y,
      battery: this.battery,
      resources: { ...this.resources },
      upgrades: Array.from(this.upgrades.entries()),
      totalPlaytime: this.totalPlaytime,
      spawnPoint: { ...this.spawnPoint },
      direction: this.direction, // Save direction too
    };
  }
}

export { Player };
