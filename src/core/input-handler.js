// src/core/input-handler.js
import { Directions } from '../utils/directions.js';
import { GameEvents } from './game-events.js';
import { getStats } from '../entities/player/player-stats.js';

class InputHandler {
  constructor() {
    this.directions = {
      w: Directions.UP,
      a: Directions.LEFT,
      s: Directions.DOWN,
      d: Directions.RIGHT,
      arrowup: Directions.UP,
      arrowleft: Directions.LEFT,
      arrowdown: Directions.DOWN,
      arrowright: Directions.RIGHT,
    };
    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', e => {
      // Don't process keys when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Don't process keys when modals are open (except ESC)
      if (this.isModalOpen() && e.key !== 'Escape') {
        return;
      }

      const key = e.key.toLowerCase();

      // Movement
      if (this.directions[key]) {
        e.preventDefault();
        GameEvents.Player.Emit.attemptMove(this.directions[key]);
      }
      // Interaction
      else if (key === 'e' || key === ' ' || key === 'enter') {
        e.preventDefault();
        GameEvents.Player.Emit.attemptInteract();
      }
      // Active abilities (1-9)
      else if (key >= '1' && key <= '9') {
        e.preventDefault();
        this.handleAbilityHotkey(parseInt(key));
      }
      // UI hotkeys
      else if (key === 'l') {
        e.preventDefault();
        GameEvents.Story.Emit.openJournal();
      } else if (key === 'p') {
        e.preventDefault();
        GameEvents.UI.Emit.openPassiveEquipment();
      } else if (key === 'm') {
        e.preventDefault();
        this.handleMinimapToggle();
      } else if (key === 'u') {
        e.preventDefault();
        GameEvents.UI.Emit.openUpgrades({ shopType: 'always_on' });
      } else if (key === 'h') {
        e.preventDefault();
        this.showHelp();
      }
      // Escape to close modals
      else if (key === 'escape') {
        e.preventDefault();
        this.handleEscape();
      }
    });
  }

  handleAbilityHotkey(keyNumber) {
    // This will be handled by the ActiveAbilitiesHotbar
    const event = new CustomEvent('abilityHotkey', {
      detail: { keyNumber },
    });

    document.dispatchEvent(event);
  }

  handleMinimapToggle() {
    const playerStats = getStats();

    if (playerStats.getUpgradeCount('NAVIGATION_MATRIX') > 0) {
      GameEvents.UI.Emit.toggleMinimap();
    } else {
      GameEvents.Game.Emit.message(
        'Navigation Matrix upgrade required for minimap'
      );
    }
  }

  handleEscape() {
    // Close any open modals
    const modals = [
      'story-modal',
      'new-upgrade-modal',
      'passive-equipment-modal',
      'journal-modal',
    ];

    let modalClosed = false;

    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);

      if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
        modalClosed = true;
      }
    });

    if (modalClosed) {
      GameEvents.Game.Emit.resumed();
    }
  }

  isModalOpen() {
    const modals = [
      'story-modal',
      'new-upgrade-modal',
      'passive-equipment-modal',
      'journal-modal',
    ];

    return modals.some(modalId => {
      const modal = document.getElementById(modalId);

      return modal && modal.classList.contains('active');
    });
  }

  // Add help display
  showHelp() {
    const helpText = `
CONTROLS:
Movement: WASD or Arrow Keys
Interact: E, Space, or Enter
Journal: L
Passive Equipment: P
Minimap: M (requires Navigation Matrix)
Upgrades: U
Active Abilities: 1-9
Close Modals: Escape
Help: H

TIPS:
- Explore rooms to find story fragments
- Manage your battery carefully
- Purchase upgrades to enhance your abilities
- Equip passive abilities for permanent bonuses
    `;

    GameEvents.Game.Emit.message(helpText);
  }

  // Method to display controls hint
  displayControlsHint() {
    GameEvents.Game.Emit.message(
      'Press H for help, or check the controls in the readme'
    );
  }
}

export { InputHandler };
