// src/ui/active-abilities-hotbar.js
import { GameEvents } from '../core/game-events.js';
import { getStats } from '../entities/player/player-stats.js';
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';

export class ActiveAbilitiesHotbar {
  constructor() {
    this.container = null;
    this.abilities = new Map(); // Maps key numbers to ability IDs
    this.createHotbar();
    this.setupEventListeners();
    this.refresh();
  }

  createHotbar() {
    this.container = document.createElement('div');
    this.container.id = 'active-abilities-hotbar';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #00ff00;
      border-radius: 10px;
      padding: 10px;
      z-index: 100;
      font-family: monospace;
    `;

    document.getElementById('game-container').appendChild(this.container);
  }

  setupEventListeners() {
    // Listen for keyboard input
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const keyNumber = parseInt(e.key);

      if (keyNumber >= 1 && keyNumber <= 9) {
        this.useAbility(keyNumber);
      }
    });

    // Listen for player updates
    GameEvents.Player.Listeners.updated(() => {
      this.refresh();
    });

    // Listen for upgrade purchases
    GameEvents.Upgrades.Listeners.purchase(() => {
      this.refresh();
    });
  }

  refresh() {
    this.container.innerHTML = '';
    this.abilities.clear();

    const stats = getStats();
    const allUpgrades = UpgradeSystem.getAllUpgrades();
    const activeAbilities = [];

    // Find all active abilities the player owns
    for (const [id, upgrade] of Object.entries(allUpgrades)) {
      if (upgrade.type === 'active' && stats.getUpgradeCount(id) > 0) {
        activeAbilities.push({ id, ...upgrade });
      }
    }

    // Show hotbar only if player has active abilities
    if (activeAbilities.length === 0) {
      this.container.style.display = 'none';

      return;
    }

    this.container.style.display = 'flex';

    // Create slots for abilities (up to 9)
    for (let i = 1; i <= Math.min(9, activeAbilities.length); i++) {
      const ability = activeAbilities[i - 1];

      this.abilities.set(i, ability.id);

      const slot = this.createAbilitySlot(i, ability);

      this.container.appendChild(slot);
    }
  }

  createAbilitySlot(keyNumber, ability) {
    const slot = document.createElement('div');

    slot.style.cssText = `
      width: 60px;
      height: 60px;
      border: 2px solid #00ff00;
      border-radius: 8px;
      background: rgba(0, 255, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
    `;

    const canUse = this.canUseAbility(ability);

    if (!canUse) {
      slot.style.borderColor = '#666';
      slot.style.background = 'rgba(100, 100, 100, 0.1)';
      slot.style.opacity = '0.5';
      slot.style.cursor = 'not-allowed';
    }

    // Icon
    const icon = document.createElement('div');

    icon.textContent = ability.icon;
    icon.style.cssText = `
      font-size: 24px;
      line-height: 1;
      margin-bottom: 2px;
    `;

    // Key number
    const keyLabel = document.createElement('div');

    keyLabel.textContent = keyNumber;
    keyLabel.style.cssText = `
      font-size: 10px;
      color: #888;
      position: absolute;
      bottom: 2px;
      right: 4px;
    `;

    // Battery cost
    if (ability.batteryCost) {
      const cost = document.createElement('div');

      cost.textContent = ability.batteryCost + '⚡';
      cost.style.cssText = `
        font-size: 8px;
        color: #ffaa00;
        position: absolute;
        top: 2px;
        left: 4px;
        background: rgba(0, 0, 0, 0.8);
        padding: 1px 3px;
        border-radius: 3px;
      `;
      slot.appendChild(cost);
    }

    slot.appendChild(icon);
    slot.appendChild(keyLabel);

    // Tooltip
    slot.title = `${ability.name}\n${ability.description}${ability.batteryCost ? `\nCost: ${ability.batteryCost} battery` : ''}`;

    // Click handler
    slot.addEventListener('click', () => {
      this.useAbility(keyNumber);
    });

    // Hover effect
    slot.addEventListener('mouseenter', () => {
      if (canUse) {
        slot.style.background = 'rgba(0, 255, 0, 0.2)';
        slot.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
      }
    });

    slot.addEventListener('mouseleave', () => {
      if (canUse) {
        slot.style.background = 'rgba(0, 255, 0, 0.1)';
        slot.style.boxShadow = 'none';
      }
    });

    return slot;
  }

  canUseAbility(ability) {
    const stats = getStats();

    // Check battery cost
    if (ability.batteryCost && stats.battery < ability.batteryCost) {
      return false;
    }

    // Check specific ability conditions
    switch (ability.id) {
      case 'NANITE_CONVERTER':
        return stats.resources.Nanites >= 100;
      case 'EMERGENCY_BURST':
        return stats.battery / stats.maxBattery <= 0.25;
      default:
        return true;
    }
  }

  useAbility(keyNumber) {
    const abilityId = this.abilities.get(keyNumber);

    if (!abilityId) return;

    // Get the player instance from the game
    if (window.game && window.game.player) {
      const result = window.game.player.useActiveAbility(abilityId);

      if (result.success) {
        GameEvents.Game.Emit.message(result.message);
        this.refresh();
      } else {
        GameEvents.Game.Emit.message(`Cannot use ability: ${result.message}`);
      }
    }
  }
}

// Factory function for delayed initialization
let activeAbilitiesHotbar = null;

export function initializeActiveAbilitiesHotbar() {
  if (!activeAbilitiesHotbar) {
    activeAbilitiesHotbar = new ActiveAbilitiesHotbar();
    console.log('Active abilities hotbar initialized');
  }

  return activeAbilitiesHotbar;
}

export function getActiveAbilitiesHotbar() {
  return activeAbilitiesHotbar;
}
