import {
  RESOURCE_TYPES,
  hasMoreResources,
} from '../resources/resource-manager.js';
import { eventBus } from '../../core/event-bus.js';
import { getStats } from '../../entities/player/player-stats.js';

// Available upgrades with their costs
export const UPGRADE_DEFS = {
  BATTERY_CAPACITY: {
    id: 'BATTERY_CAPACITY',
    name: 'Battery Capacity',
    description: 'Increase maximum battery capacity by 100',
    repeatable: true,
    cost: {
      [RESOURCE_TYPES.NANITES]: 50,
    },
  },
  MOVEMENT_EFFICIENCY: {
    id: 'MOVEMENT_EFFICIENCY',
    name: 'Movement Efficiency',
    description: 'Gives a 10% chance to not use battery',
    repeatable: false,
    cost: {
      [RESOURCE_TYPES.NANITES]: 30,
    },
  },
  RESOURCE_HARVEST: {
    id: 'RESOURCE_HARVEST',
    name: 'Resource Harvest',
    description: 'Increase resource collection by 50%',
    repeatable: true,
    cost: {
      [RESOURCE_TYPES.NANITES]: 40,
    },
  },
};

class UpgradeSystem {
  static getAvailableUpgrades() {
    return UPGRADE_DEFS;
  }

  static canAffordUpgrade(upgradeId, playerResources) {
    const upgrade = UPGRADE_DEFS[upgradeId];

    return upgrade && hasMoreResources(playerResources, upgrade.cost);
  }

  static purchaseUpgrade(upgradeId) {
    const def = UPGRADE_DEFS[upgradeId];

    if (!def) return false;
    eventBus.emit('purchase-upgrade', def);

    return this.canAffordUpgrade(upgradeId, getStats().resources);
  }
}

export { UpgradeSystem };
