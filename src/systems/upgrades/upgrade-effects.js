// src/systems/upgrades/upgrade-effects.js
import { GameEvents } from '../../core/game-events.js';
import { getStats } from '../../entities/player/player-stats.js';

export class UpgradeEffects {
  constructor() {
    this.cooldowns = new Map(); // Track per-reset and global cooldowns
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for reset events to clear per-reset cooldowns
    GameEvents.Game.Listeners.resetState(() => {
      this.clearPerResetCooldowns();
    });

    // Listen for upgrade purchases to apply immediate effects
    GameEvents.Upgrades.Listeners.purchase(upgrade => {
      this.applyUpgradeEffect(upgrade);
    });
  }

  // Apply passive upgrade effects (called during game initialization and when loading saves)
  applyPassiveEffects(player) {
    const stats = getStats();

    // Apply deep sleep protocol
    const deepSleepLevel = stats.getUpgradeCount('DEEP_SLEEP_PROTOCOL');

    if (deepSleepLevel > 0) {
      const bonusBattery = Math.floor(player.maxBattery * 0.2 * deepSleepLevel);

      player.battery = Math.min(
        player.maxBattery,
        player.battery + bonusBattery
      );
      GameEvents.Game.Emit.message(
        `Deep Sleep Protocol: +${bonusBattery} battery`
      );
    }

    // Apply knowledge integration
    const knowledgeLevel = stats.getUpgradeCount('KNOWLEDGE_INTEGRATION');

    if (knowledgeLevel > 0) {
      const storyBonus = this.calculateKnowledgeBonus(knowledgeLevel);

      if (storyBonus > 0) {
        GameEvents.Resources.Emit.add('Nanites', storyBonus);
        GameEvents.Game.Emit.message(
          `Knowledge Integration: +${storyBonus} nanites`
        );
      }
    }
  }

  // Handle resource collection with power siphon
  handleResourceCollection(_resourceType, _amount) {
    const stats = getStats();
    const powerSiphonLevel = stats.getUpgradeCount('POWER_SIPHON');

    if (powerSiphonLevel > 0) {
      const chance = powerSiphonLevel * 0.2; // 20% per level

      if (Math.random() < chance) {
        // Add battery directly to player (need to emit event for this)
        GameEvents.Player.Emit.gainBattery(1);
        GameEvents.Game.Emit.message('Power Siphon: +1 battery');
      }
    }
  }

  // Calculate upgrade costs with efficiency matrix
  calculateModifiedCost(baseCost) {
    const stats = getStats();
    const efficiencyLevel = stats.getUpgradeCount('EFFICIENCY_MATRIX');

    if (efficiencyLevel === 0) return baseCost;

    const discount = efficiencyLevel * 0.1; // 10% per level
    const modifiedCost = {};

    for (const [resource, amount] of Object.entries(baseCost)) {
      modifiedCost[resource] = Math.ceil(amount * (1 - discount));
    }

    return modifiedCost;
  }

  // Handle active ability usage
  async useActiveAbility(abilityId) {
    const stats = getStats();

    if (!stats.getUpgradeCount(abilityId)) {
      return { success: false, message: 'Ability not available' };
    }

    if (this.isOnCooldown(abilityId)) {
      return { success: false, message: 'Ability on cooldown' };
    }

    const handlers = {
      NANITE_CONVERTER: () => this.useNaniteConverter(),
      FABRICATOR_REFRESH: () => this.useFabricatorRefresh(),
      QUANTUM_TELEPORT: () => this.useQuantumTeleport(),
      EMERGENCY_BURST: () => this.useEmergencyBurst(),
    };

    const handler = handlers[abilityId];

    if (!handler) {
      return { success: false, message: 'Unknown ability' };
    }

    const result = await handler();

    if (result.success) {
      this.setCooldown(abilityId);
    }

    return result;
  }

  // Active ability implementations
  useNaniteConverter() {
    const stats = getStats();

    if (stats.resources.Nanites < 100) {
      return { success: false, message: 'Need 100 nanites' };
    }

    GameEvents.Resources.Emit.add('Nanites', -100);
    GameEvents.Player.Emit.gainBattery(10);

    return { success: true, message: 'Converted 100 nanites to 10 battery' };
  }

  useFabricatorRefresh() {
    const stats = getStats();

    if (stats.battery < 15) {
      return { success: false, message: 'Need 15 battery' };
    }

    // Find nearest nanofabricator and refresh it
    GameEvents.Player.Emit.loseBattery(15);
    GameEvents.Game.Emit.refreshNearestFabricator();

    return { success: true, message: 'Nanofabricator refreshed' };
  }

  useQuantumTeleport() {
    const stats = getStats();

    if (stats.battery < 20) {
      return { success: false, message: 'Need 20 battery' };
    }

    GameEvents.Player.Emit.loseBattery(20);
    GameEvents.Player.Emit.teleportToSpawn();

    return { success: true, message: 'Teleported to spawn point' };
  }

  useEmergencyBurst() {
    const stats = getStats();
    const currentPercent = stats.battery / stats.maxBattery;

    if (currentPercent > 0.25) {
      return { success: false, message: 'Can only use below 25% battery' };
    }

    GameEvents.Player.Emit.gainBattery(50);

    return { success: true, message: 'Emergency burst: +50 battery' };
  }

  // Cooldown management
  isOnCooldown(abilityId) {
    return (
      this.cooldowns.has(abilityId) &&
      this.cooldowns.get(abilityId) > Date.now()
    );
  }

  setCooldown(abilityId) {
    // For per_reset abilities, we just mark them as used this reset
    // For timed abilities, we'd set an actual timestamp
    this.cooldowns.set(abilityId, 'used_this_reset');
  }

  clearPerResetCooldowns() {
    for (const [abilityId, cooldown] of this.cooldowns.entries()) {
      if (cooldown === 'used_this_reset') {
        this.cooldowns.delete(abilityId);
      }
    }
  }

  // Helper methods
  calculateKnowledgeBonus(_level) {
    // This would need access to story system
    // return discoveredFragments * level * 5; // 5 nanites per fragment per level
    return 0; // Placeholder
  }

  applyUpgradeEffect(upgrade) {
    // Handle immediate effects when purchasing upgrades
    switch (upgrade.id) {
      case 'ROOM_SCANNER':
        GameEvents.Game.Emit.message(
          'Room Scanner installed - rooms will be fully revealed when entered'
        );
        break;
      case 'NAVIGATION_MATRIX':
        GameEvents.Game.Emit.message(
          'Navigation Matrix online - minimap available'
        );
        GameEvents.UI.Emit.enableMinimap();
        break;
      // Add other immediate effects
    }
  }
}

export const upgradeEffects = new UpgradeEffects();
