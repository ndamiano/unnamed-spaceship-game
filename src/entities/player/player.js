// src/entities/player/player.js
import { Directions } from '../../utils/directions.js';
import { GameEvents } from '../../core/game-events.js';
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

    // Don't register event handlers in constructor
    this.eventHandlersRegistered = false;
  }

  // Call this after the player is registered with PlayerStats
  initializeEventHandlers() {
    if (this.eventHandlersRegistered) {
      return; // Prevent double registration
    }

    this.registerEventHandlers();
    this.eventHandlersRegistered = true;

    // Now it's safe to emit the initial update
    GameEvents.Player.Emit.updated(getStats());
  }

  registerEventHandlers() {
    GameEvents.Player.Listeners.move(({ x, y, direction }) => {
      this.x = x;
      this.y = y;
      this.direction = direction;

      this.battery -= this.movementCost;
      this.updatePlaytime();
      GameEvents.Player.Emit.updated(getStats());
    });

    GameEvents.Player.Listeners.directionChange(direction => {
      this.direction = direction;
      GameEvents.Player.Emit.updated(this);
    });

    GameEvents.Player.Listeners.updated(player => {
      if (player.battery <= 0) {
        GameEvents.Game.Emit.message(
          'As you feel your battery getting close to empty, you return to your charging pod.'
        );
        GameEvents.Game.Emit.resetState();
        this.reset();
      }
    });

    GameEvents.Upgrades.Listeners.purchase(upgrade_def => {
      if (UpgradeSystem.canAffordUpgrade(upgrade_def.id, this.resources)) {
        this.resources = subtractResources(this.resources, upgrade_def.cost);
        const currentCount = this.upgrades.get(upgrade_def.id) ?? 0;

        this.upgrades.set(upgrade_def.id, currentCount + 1);
        GameEvents.Player.Emit.updated();
        GameEvents.Game.Emit.message('Upgrade purchased: ' + upgrade_def.name);
      }
    });

    GameEvents.Resources.Listeners.add(({ type, amount }) => {
      const toAdd = amount * this.harvestMultiplier;

      this.resources = modifyResources(this.resources, {
        [type]: toAdd,
      });
      GameEvents.Player.Emit.updated(getStats());
    });

    GameEvents.Save.Listeners.restorePlayer(playerData => {
      this.restoreState(playerData);
    });
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

    if (this.renderable) {
      GameEvents.Player.Emit.move(this.x, this.y, this.direction);
    }
  }

  restoreState(playerData) {
    console.log('Restoring player state:', playerData);

    if (playerData.x !== undefined) this.x = playerData.x;
    if (playerData.y !== undefined) this.y = playerData.y;
    if (playerData.battery !== undefined) this.battery = playerData.battery;
    if (playerData.resources) this.resources = { ...playerData.resources };
    if (playerData.totalPlaytime) this.totalPlaytime = playerData.totalPlaytime;

    if (playerData.upgrades) {
      if (Array.isArray(playerData.upgrades)) {
        this.upgrades = new Map(playerData.upgrades);
      } else if (playerData.upgrades instanceof Map) {
        this.upgrades = new Map(playerData.upgrades);
      } else {
        this.upgrades = new Map(Object.entries(playerData.upgrades));
      }
    }

    if (playerData.direction) {
      this.direction = playerData.direction;
    }

    this.playtimeStart = Date.now();

    if (this.renderable) {
      GameEvents.Player.Emit.move(this.x, this.y, this.direction);
    }

    if (this.eventHandlersRegistered) {
      GameEvents.Player.Emit.updated(getStats());
    }

    GameEvents.Game.Emit.message(
      'Welcome back! Your progress has been restored.'
    );
  }

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
      direction: this.direction,
    };
  }
}

export { Player };
