import { Directions } from './Utils.js';
import { eventBus } from './EventBus.js';
import {
  BASE_RESOURCES,
  modifyResources,
  subtractResources,
} from './resources.js';
import { getStats } from './PlayerStats.js';
import { UPGRADE_DEFS, UpgradeSystem } from './UpgradeSystem.js';

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

    this.registerEventHandlers();
  }

  render(ctx, centerX, centerY, _tileSize) {
    const assetImage = new Image();

    assetImage.src = `assets/player-100x100.png`;

    ctx.save();

    ctx.translate(centerX, centerY);

    if (this.direction === Directions.UP) {
      ctx.rotate(Math.PI);
    } else if (this.direction === Directions.RIGHT) {
      ctx.rotate(-Math.PI / 2);
    } else if (this.direction === Directions.LEFT) {
      ctx.rotate(Math.PI / 2);
    }

    ctx.drawImage(assetImage, -64, -64);
    ctx.restore();
  }

  registerEventHandlers() {
    eventBus.on('player-move', ({ x, y, direction }) => {
      this.x = x;
      this.y = y;
      this.direction = direction;

      this.battery -= this.movementCost;
      this.updatePlaytime();
      eventBus.emit('player-updated', getStats());
    });

    eventBus.on('player-direction-change', direction => {
      this.direction = direction;
      eventBus.emit('player-updated', this);
    });

    eventBus.on('player-updated', player => {
      if (player.battery <= 0) {
        eventBus.emit(
          'game-message',
          'As you feel your battery getting close to empty, you return to your charging pod.'
        );
        eventBus.emit('reset-state');
        this.reset();
      }
    });

    eventBus.on('purchase-upgrade', upgrade_def => {
      if (UpgradeSystem.canAffordUpgrade(upgrade_def.id, this.resources)) {
        this.resources = subtractResources(this.resources, upgrade_def.cost);
        const currentCount = this.upgrades.get(upgrade_def.id) ?? 0;

        this.upgrades.set(upgrade_def.id, currentCount + 1);
        eventBus.emit('player-updated');
        eventBus.emit('game-message', 'Upgrade purchased: ' + upgrade_def.name);
      }
    });

    // Resource event handlers
    eventBus.on('add-resource', ({ type, amount }) => {
      const toAdd = amount * this.harvestMultiplier;

      this.resources = modifyResources(this.resources, {
        [type]: toAdd,
      });
      eventBus.emit('player-updated', getStats());
    });

    // Save/Load event handlers
    eventBus.on('restore-player-state', playerData => {
      this.restoreState(playerData);
    });

    eventBus.emit('player-updated', this);
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

    // Reset playtime tracking
    this.playtimeStart = Date.now();

    eventBus.emit('player-updated', getStats());
    eventBus.emit(
      'game-message',
      'Welcome back! Your progress has been restored.'
    );
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
    };
  }
}

export { Player };
