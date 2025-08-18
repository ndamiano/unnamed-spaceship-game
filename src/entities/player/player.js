// src/entities/player/player.js
import { Directions } from '../../utils/directions.js';
import { GameEvents } from '../../core/game-events.js';
import {
  BASE_RESOURCES,
  modifyResources,
  subtractResources,
  hasMoreResources,
} from '../../systems/resources/resource-manager.js';
import { getStats } from './player-stats.js';

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

    // Enhanced features
    this.equippedPassives = new Map();
    this.maxPassiveSlots = 1;
    this.visitedRoomTypes = new Set();
    this.currentRoom = null;
    this.abilityHotbarAssignments = {};
    this.emergencyReservesUsed = false;
    this.fabricatorRefreshUsed = false;
    this.emergencyBurstUsed = false;
    this.naniteConverterUsed = false;

    // Rendering
    this.renderable = null;
    this.eventHandlersRegistered = false;
  }

  initializeEventHandlers() {
    if (this.eventHandlersRegistered) {
      return;
    }

    this.registerEventHandlers();
    this.registerEnhancedEventHandlers();
    this.eventHandlersRegistered = true;

    GameEvents.Player.Emit.updated(getStats());
  }

  registerEventHandlers() {
    GameEvents.Player.Listeners.move(({ x, y, direction }) => {
      this.x = x;
      this.y = y;
      this.direction = direction;

      // Check for movement efficiency upgrade
      const movementEfficiency = this.upgrades.get('MOVEMENT_EFFICIENCY') || 0;
      const efficiencyChance = movementEfficiency * 0.1;

      if (Math.random() > efficiencyChance) {
        this.battery -= this.movementCost;
      } else {
        GameEvents.Game.Emit.message(
          'Movement efficiency activated - no battery consumed'
        );
      }

      this.updatePlaytime();
      this.checkRoomEntry();
      GameEvents.Player.Emit.updated(getStats());
    });

    GameEvents.Player.Listeners.directionChange(direction => {
      this.direction = direction;
      GameEvents.Player.Emit.updated(this);
    });

    GameEvents.Player.Listeners.updated(player => {
      if (player.battery <= 0) {
        this.handleBatteryDepletion();
      }
    });

    GameEvents.Upgrades.Listeners.purchase(upgrade_def => {
      const cost = upgrade_def.cost;

      if (cost && hasMoreResources(this.resources, cost)) {
        this.resources = subtractResources(this.resources, cost);
        const currentCount = this.upgrades.get(upgrade_def.id) ?? 0;

        this.upgrades.set(upgrade_def.id, currentCount + 1);
        GameEvents.Player.Emit.updated();

        const levelText = upgrade_def.currentLevel
          ? ` (Level ${upgrade_def.currentLevel})`
          : '';

        GameEvents.Game.Emit.message(
          `Upgrade purchased: ${upgrade_def.name}${levelText}`
        );

        // Apply immediate upgrade effects
        this.applyUpgradeEffect(upgrade_def);
      }
    });

    GameEvents.Resources.Listeners.add(({ type, amount }) => {
      this.handleResourceCollection(type, amount);
    });

    GameEvents.Save.Listeners.restorePlayer(playerData => {
      this.restoreState(playerData);
    });

    GameEvents.Game.Listeners.resetState(() => {
      this.onReset();
    });
  }

  registerEnhancedEventHandlers() {
    // Battery management
    GameEvents.Player.Listeners.gainBattery(amount => {
      this.battery = Math.min(this.maxBattery, this.battery + amount);
      GameEvents.Player.Emit.updated(getStats());
    });

    GameEvents.Player.Listeners.loseBattery(amount => {
      this.battery = Math.max(0, this.battery - amount);
      GameEvents.Player.Emit.updated(getStats());
    });

    // Passive equipment
    GameEvents.Player.Listeners.equipPassive(({ abilityId, slotIndex }) => {
      this.equipPassiveAbility(abilityId, slotIndex);
    });

    GameEvents.Player.Listeners.unequipPassive(abilityId => {
      this.unequipPassiveAbility(abilityId);
    });

    // Teleportation
    GameEvents.Player.Listeners.teleportToSpawn(() => {
      this.teleportToSpawn();
    });

    // Room tracking
    GameEvents.Player.Listeners.enterRoom(roomType => {
      this.handleRoomEntry(roomType);
    });

    GameEvents.Player.Listeners.updateSpawn(newSpawn => {
      this.spawnPoint = newSpawn;
    });
  }

  // Enhanced battery depletion with emergency reserves
  handleBatteryDepletion() {
    const hasEmergencyReserves = this.hasUpgrade('EMERGENCY_RESERVES');

    if (hasEmergencyReserves && !this.emergencyReservesUsed) {
      this.battery = Math.floor(this.maxBattery * 0.5);
      this.emergencyReservesUsed = true;

      GameEvents.Game.Emit.message(
        'Emergency Reserves activated! Battery restored to 50%. Next depletion will cause reset.'
      );

      GameEvents.Player.Emit.updated(getStats());

      return;
    }

    GameEvents.Game.Emit.message(
      'As you feel your battery getting close to empty, you return to your charging pod.'
    );
    GameEvents.Game.Emit.resetState();
    this.reset();
  }

  // Passive equipment methods
  equipPassiveAbility(abilityId, slotIndex) {
    const maxSlots = this.getMaxPassiveSlots();

    if (slotIndex >= maxSlots) {
      GameEvents.Game.Emit.message('Invalid equipment slot');

      return false;
    }

    // Check if already equipped in any slot
    for (const [_slot, ability] of this.equippedPassives.entries()) {
      if (ability === abilityId) {
        GameEvents.Game.Emit.message('Passive already equipped');

        return false;
      }
    }

    // Check if slot is occupied
    if (this.equippedPassives.has(slotIndex)) {
      GameEvents.Game.Emit.message('Slot already occupied');

      return false;
    }

    // Equip to specific slot
    this.equippedPassives.set(slotIndex, abilityId);
    GameEvents.Player.Emit.passiveEquipped(abilityId);

    return true;
  }

  unequipPassiveAbility(abilityId) {
    for (const [slot, ability] of this.equippedPassives.entries()) {
      if (ability === abilityId) {
        this.equippedPassives.delete(slot);
        GameEvents.Player.Emit.passiveUnequipped(abilityId);

        return true;
      }
    }

    return false;
  }

  hasEquippedPassive(abilityId) {
    return Array.from(this.equippedPassives.values()).includes(abilityId);
  }

  getMaxPassiveSlots() {
    const expansionUpgrades = this.upgrades.get('PASSIVE_SLOT_EXPANSION') || 0;

    return this.maxPassiveSlots + expansionUpgrades;
  }

  // Teleportation
  teleportToSpawn() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    GameEvents.Player.Emit.move(this.x, this.y, this.direction);
  }

  // Room tracking and exploration rewards
  checkRoomEntry() {
    // This would need ship integration to detect actual room changes
    // For now, this is a placeholder that gets called on movement
    const currentRoomData = this.getCurrentRoomData();

    if (currentRoomData && currentRoomData.type !== this.currentRoom) {
      this.currentRoom = currentRoomData.type;
      GameEvents.Player.Emit.enterRoom(currentRoomData);

      // Handle room scanner
      if (this.hasUpgrade('ROOM_SCANNER')) {
        GameEvents.Game.Emit.revealCurrentRoom();
      }
    }
  }

  handleRoomEntry(roomData) {
    const roomType = roomData.type || roomData;

    // Exploration rewards
    if (!this.visitedRoomTypes.has(roomType)) {
      this.visitedRoomTypes.add(roomType);
      this.handleExplorationReward(roomType);
    }
  }

  handleExplorationReward(roomType) {
    const explorationLevel = this.upgrades.get('EXPLORATION_REWARDS') || 0;

    if (explorationLevel > 0) {
      const reward = explorationLevel * 5;

      GameEvents.Resources.Emit.add('Nanites', reward);
      GameEvents.Game.Emit.message(
        `Exploration bonus: +${reward} nanites for discovering ${roomType}`
      );
    }
  }

  getCurrentRoomData() {
    const game = window.game;

    if (!game?.ship?.map) return null;

    const currentRoom = game.ship.map.rooms?.find(
      room =>
        this.x >= room.x &&
        this.x < room.x + room.width &&
        this.y >= room.y &&
        this.y < room.y + room.height
    );

    return currentRoom
      ? {
          type: currentRoom.id,
          name: currentRoom.name,
          room: currentRoom,
        }
      : null;
  }

  // Resource collection with power siphon
  handleResourceCollection(type, amount) {
    const toAdd = amount * this.harvestMultiplier;

    this.resources = modifyResources(this.resources, {
      [type]: toAdd,
    });
    GameEvents.Game.Emit.message(`Received ${toAdd} ${type}`);

    // Check for power siphon
    const powerSiphonLevel = this.upgrades.get('POWER_SIPHON') || 0;

    if (powerSiphonLevel > 0) {
      const chance = powerSiphonLevel * 0.2;

      if (Math.random() < chance) {
        GameEvents.Player.Emit.gainBattery(1);
        GameEvents.Game.Emit.message('Power Siphon: +1 battery');
      }
    }

    GameEvents.Player.Emit.updated(getStats());
  }

  // Apply immediate upgrade effects
  applyUpgradeEffect(upgrade) {
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
      case 'PASSIVE_SLOT_EXPANSION':
        GameEvents.Game.Emit.message(
          'Neural interface expanded - additional passive slot available'
        );
        break;
    }
  }

  // Active ability usage
  canUseActiveAbility(abilityId) {
    if (!this.hasUpgrade(abilityId)) return false;

    switch (abilityId) {
      case 'NANITE_CONVERTER':
        return !this.naniteConverterUsed && this.resources.Nanites >= 100;
      case 'FABRICATOR_REFRESH':
        return this.battery >= 15;
      case 'QUANTUM_TELEPORT':
        return this.battery >= 20;
      case 'EMERGENCY_BURST':
        return (
          !this.emergencyBurstUsed && this.battery / this.maxBattery <= 0.25
        );
      default:
        return true;
    }
  }

  useActiveAbility(abilityId) {
    if (!this.canUseActiveAbility(abilityId)) {
      return { success: false, message: 'Cannot use ability' };
    }

    switch (abilityId) {
      case 'NANITE_CONVERTER':
        return this.useNaniteConverter();
      case 'FABRICATOR_REFRESH':
        return this.useFabricatorRefresh();
      case 'QUANTUM_TELEPORT':
        return this.useQuantumTeleport();
      case 'EMERGENCY_BURST':
        return this.useEmergencyBurst();
      default:
        return { success: false, message: 'Unknown ability' };
    }
  }

  useNaniteConverter() {
    GameEvents.Resources.Emit.add('Nanites', -100);
    GameEvents.Player.Emit.gainBattery(10);
    this.naniteConverterUsed = true;

    return { success: true, message: 'Converted 100 nanites to 10 battery' };
  }

  useFabricatorRefresh() {
    GameEvents.Player.Emit.loseBattery(15);
    GameEvents.Game.Emit.refreshNearestFabricator();

    return { success: true, message: 'Nanofabricator refreshed' };
  }

  useQuantumTeleport() {
    GameEvents.Player.Emit.loseBattery(20);
    this.teleportToSpawn();

    return { success: true, message: 'Teleported to spawn point' };
  }

  useEmergencyBurst() {
    GameEvents.Player.Emit.gainBattery(50);
    this.emergencyBurstUsed = true;

    return { success: true, message: 'Emergency burst: +50 battery' };
  }

  interact(object) {
    if (typeof object.onInteract === 'function') {
      object.onInteract(this);
    }
  }

  get maxBattery() {
    const capacityUpgrade = this.upgrades.get('BATTERY_CAPACITY') || 0;

    return 100 + 100 * capacityUpgrade;
  }

  get harvestMultiplier() {
    const harvestMultiplier = this.upgrades.get('RESOURCE_HARVEST') || 0;

    return 1 + 0.5 * harvestMultiplier;
  }

  get explorationRadius() {
    const sensorUpgrade = this.upgrades.get('SENSOR_RANGE') || 0;

    return 2 + sensorUpgrade;
  }

  get storyBonus() {
    const storyScanner = this.upgrades.get('STORY_SCANNER') || 0;

    return storyScanner * 0.2;
  }

  hasUpgrade(upgradeId) {
    return this.upgrades.has(upgradeId) && this.upgrades.get(upgradeId) > 0;
  }

  getUpgradeLevel(upgradeId) {
    return this.upgrades.get(upgradeId) || 0;
  }

  canQuantumTeleport() {
    return this.hasUpgrade('QUANTUM_ENTANGLEMENT') && this.battery >= 20;
  }

  quantumTeleport() {
    if (!this.canQuantumTeleport()) return false;

    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.battery -= 20;

    GameEvents.Game.Emit.message(
      'Quantum entanglement activated - teleported to spawn'
    );
    GameEvents.Player.Emit.move(this.x, this.y, this.direction);

    return true;
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

    // Apply deep sleep protocol
    this.applyResetBonuses();

    // Reset per-reset abilities
    this.onReset();

    if (this.renderable) {
      GameEvents.Player.Emit.move(this.x, this.y, this.direction);
    }
  }

  onReset() {
    this.emergencyReservesUsed = false;
    this.naniteConverterUsed = false;
    this.emergencyBurstUsed = false;
    // fabricatorRefreshUsed doesn't reset as it has no cooldown
  }

  applyResetBonuses() {
    // Deep sleep protocol
    const deepSleepLevel = this.upgrades.get('DEEP_SLEEP_PROTOCOL') || 0;

    if (deepSleepLevel > 0) {
      const bonusBattery = Math.floor(this.maxBattery * 0.2 * deepSleepLevel);

      this.battery = Math.min(this.maxBattery, this.battery + bonusBattery);
      GameEvents.Game.Emit.message(
        `Deep Sleep Protocol: +${bonusBattery} battery`
      );
    }

    // Knowledge integration
    const knowledgeLevel = this.upgrades.get('KNOWLEDGE_INTEGRATION') || 0;

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

  calculateKnowledgeBonus(level) {
    // This would need story system integration
    // For now, placeholder calculation
    const discoveredFragments = this.visitedRoomTypes.size;

    return discoveredFragments * level * 5;
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

    // Enhanced state restoration
    if (playerData.equippedPassives) {
      this.equippedPassives = new Map(playerData.equippedPassives);
    }

    if (playerData.visitedRoomTypes) {
      this.visitedRoomTypes = new Set(playerData.visitedRoomTypes);
    }

    if (playerData.maxPassiveSlots) {
      this.maxPassiveSlots = playerData.maxPassiveSlots;
    }

    if (playerData.abilityHotbarAssignments) {
      this.abilityHotbarAssignments = playerData.abilityHotbarAssignments;
    }

    // Restore ability usage states
    this.emergencyReservesUsed = playerData.emergencyReservesUsed || false;
    this.fabricatorRefreshUsed = playerData.fabricatorRefreshUsed || false;
    this.emergencyBurstUsed = playerData.emergencyBurstUsed || false;
    this.naniteConverterUsed = playerData.naniteConverterUsed || false;

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
      equippedPassives: Array.from(this.equippedPassives.entries()),
      visitedRoomTypes: Array.from(this.visitedRoomTypes),
      maxPassiveSlots: this.maxPassiveSlots,
      abilityHotbarAssignments: this.abilityHotbarAssignments,
      emergencyReservesUsed: this.emergencyReservesUsed,
      fabricatorRefreshUsed: this.fabricatorRefreshUsed,
      emergencyBurstUsed: this.emergencyBurstUsed,
      naniteConverterUsed: this.naniteConverterUsed,
    };
  }
}

export { Player };
