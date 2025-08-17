export class UpgradeLoader {
  constructor() {
    this.upgrades = null;
    this.loadPromise = null;
  }

  async loadUpgrades() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./src/config/upgrades.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })
      .then(data => {
        this.upgrades = data;
        console.log('Upgrades loaded successfully');

        return data;
      })
      .catch(error => {
        console.error('Failed to load upgrades:', error);
        throw error;
      });

    return this.loadPromise;
  }

  getUpgrades() {
    if (!this.upgrades) {
      throw new Error('Upgrades not loaded yet. Call loadUpgrades() first.');
    }

    return this.upgrades;
  }

  getUpgrade(upgradeId) {
    const upgrades = this.getUpgrades();

    return upgrades[upgradeId] || null;
  }

  // Get available upgrades based on current player state
  getAvailableUpgrades(playerStats, storySystem) {
    const upgrades = this.getUpgrades();
    const available = {};

    for (const [id, upgrade] of Object.entries(upgrades)) {
      if (this.isUpgradeAvailable(upgrade, playerStats, storySystem)) {
        available[id] = upgrade;
      }
    }

    return available;
  }

  isUpgradeAvailable(upgrade, playerStats, storySystem) {
    const currentLevel = playerStats.getUpgradeCount(upgrade.id);

    // Check if already at max level
    if (!upgrade.repeatable && currentLevel >= 1) {
      return false;
    }

    if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) {
      return false;
    }

    // Check requirements
    if (upgrade.requirements) {
      if (
        !this.checkRequirements(upgrade.requirements, playerStats, storySystem)
      ) {
        return false;
      }
    }

    return true;
  }

  checkRequirements(requirements, playerStats, storySystem) {
    // Check upgrade count requirements
    if (requirements.upgradeCount) {
      for (const [upgradeId, requiredCount] of Object.entries(
        requirements.upgradeCount
      )) {
        if (playerStats.getUpgradeCount(upgradeId) < requiredCount) {
          return false;
        }
      }
    }

    // Check story fragment requirements
    if (requirements.storyFragments) {
      const discoveredCount = storySystem
        ? storySystem.getDiscoveredCount()
        : 0;

      if (discoveredCount < requirements.storyFragments) {
        return false;
      }
    }

    // Check completed story groups
    if (requirements.groupsCompleted && storySystem) {
      for (const groupId of requirements.groupsCompleted) {
        const progress = storySystem.getGroupProgress(groupId);

        if (!progress.complete) {
          return false;
        }
      }
    }

    return true;
  }

  // Calculate the cost for a specific upgrade level
  calculateUpgradeCost(upgradeId, currentLevel = 0) {
    const upgrade = this.getUpgrade(upgradeId);

    if (!upgrade) return null;

    const baseCost = { ...upgrade.cost };

    if (currentLevel === 0 || !upgrade.costScaling) {
      return baseCost;
    }

    const scaling = upgrade.costScaling;
    let multiplier = 1;

    if (scaling.type === 'linear') {
      multiplier = 1 + currentLevel * (scaling.multiplier - 1);
    } else if (scaling.type === 'exponential') {
      multiplier = Math.pow(scaling.multiplier, currentLevel);
    }

    const scaledCost = {};

    for (const [resource, amount] of Object.entries(baseCost)) {
      scaledCost[resource] = Math.ceil(amount * multiplier);
    }

    return scaledCost;
  }

  // Get upgrade categories for UI organization
  getUpgradeCategories() {
    const upgrades = this.getUpgrades();
    const categories = new Set();

    Object.values(upgrades).forEach(upgrade => {
      if (upgrade.category) {
        categories.add(upgrade.category);
      }
    });

    return Array.from(categories);
  }

  // Get upgrades by category
  getUpgradesByCategory(category) {
    const upgrades = this.getUpgrades();
    const filtered = {};

    for (const [id, upgrade] of Object.entries(upgrades)) {
      if (upgrade.category === category) {
        filtered[id] = upgrade;
      }
    }

    return filtered;
  }
}

// Create singleton instance
export const upgradeLoader = new UpgradeLoader();
