import { hasMoreResources } from '../resources/resource-manager.js';
import { GameEvents } from '../../core/game-events.js';
import { getStats } from '../../entities/player/player-stats.js';
import { upgradeLoader } from './upgrade-loader.js';
import { storySystem } from '../story/story-system.js';

class UpgradeSystem {
  static async initialize() {
    await upgradeLoader.loadUpgrades();
    console.log('Upgrade system initialized');
  }

  static getAvailableUpgrades(shopType = null) {
    try {
      const playerStats = getStats();
      const allUpgrades = upgradeLoader.getAvailableUpgrades(
        playerStats,
        storySystem
      );

      if (!shopType) {
        return allUpgrades;
      }

      // Filter by shop type
      const filtered = {};

      for (const [id, upgrade] of Object.entries(allUpgrades)) {
        if (upgrade.type === shopType) {
          filtered[id] = upgrade;
        }
      }

      return filtered;
    } catch (error) {
      console.error('Error getting available upgrades:', error);

      return {};
    }
  }

  static getAllUpgrades() {
    try {
      return upgradeLoader.getUpgrades();
    } catch (error) {
      console.error('Error getting all upgrades:', error);

      return {};
    }
  }

  static getUpgrade(upgradeId) {
    try {
      return upgradeLoader.getUpgrade(upgradeId);
    } catch (error) {
      console.error('Error getting upgrade:', error);

      return null;
    }
  }

  static canAffordUpgrade(upgradeId, playerResources) {
    try {
      const playerStats = getStats();
      const currentLevel = playerStats.getUpgradeCount(upgradeId);
      const cost = upgradeLoader.calculateUpgradeCost(upgradeId, currentLevel);

      return cost && hasMoreResources(playerResources, cost);
    } catch (error) {
      console.error('Error checking upgrade affordability:', error);

      return false;
    }
  }

  static purchaseUpgrade(upgradeId) {
    try {
      const upgrade = upgradeLoader.getUpgrade(upgradeId);

      if (!upgrade) return false;

      const playerStats = getStats();
      const currentLevel = playerStats.getUpgradeCount(upgradeId);
      const cost = upgradeLoader.calculateUpgradeCost(upgradeId, currentLevel);

      if (this.canAffordUpgrade(upgradeId, playerStats.resources)) {
        // Create upgrade def with current cost for the purchase event
        const upgradeDef = {
          ...upgrade,
          cost: cost,
          currentLevel: currentLevel + 1,
        };

        GameEvents.Upgrades.Emit.purchase(upgradeDef);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error purchasing upgrade:', error);

      return false;
    }
  }

  static getUpgradeCategories(shopType = null) {
    try {
      const allUpgrades = upgradeLoader.getUpgrades();
      const categories = new Set();

      for (const upgrade of Object.values(allUpgrades)) {
        if (!shopType || upgrade.type === shopType) {
          if (upgrade.category) {
            categories.add(upgrade.category);
          }
        }
      }

      return Array.from(categories);
    } catch (error) {
      console.error('Error getting upgrade categories:', error);

      return [];
    }
  }

  static getUpgradesByCategory(category, shopType = null) {
    try {
      const playerStats = getStats();
      const allByCategory = upgradeLoader.getUpgradesByCategory(category);
      const available = {};

      // Filter by availability and shop type
      for (const [id, upgrade] of Object.entries(allByCategory)) {
        if (shopType && upgrade.type !== shopType) {
          continue;
        }

        if (
          upgradeLoader.isUpgradeAvailable(upgrade, playerStats, storySystem)
        ) {
          available[id] = upgrade;
        }
      }

      return available;
    } catch (error) {
      console.error('Error getting upgrades by category:', error);

      return {};
    }
  }

  static getUpgradeCost(upgradeId, currentLevel = null) {
    try {
      if (currentLevel === null) {
        const playerStats = getStats();

        currentLevel = playerStats.getUpgradeCount(upgradeId);
      }

      return upgradeLoader.calculateUpgradeCost(upgradeId, currentLevel);
    } catch (error) {
      console.error('Error getting upgrade cost:', error);

      return null;
    }
  }

  static getShopTitle(shopType) {
    const titles = {
      always_on: 'System Upgrades',
      passive: 'Neural Modifications',
      active: 'Combat Protocols',
    };

    return titles[shopType] || 'Upgrades';
  }

  static getShopDescription(shopType) {
    const descriptions = {
      always_on: 'Permanent system enhancements and ship modifications',
      passive: 'Passive biological and neural interface improvements',
      active: 'Active abilities and emergency protocols',
    };

    return descriptions[shopType] || 'Available upgrades';
  }
}

export { UpgradeSystem };
