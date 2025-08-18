// src/ui/passive-equipment-modal.js
import { GameEvents } from '../core/game-events.js';
import { getStats } from '../entities/player/player-stats.js';
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';
import { ModalFactory } from './modal-factory.js';

export class PassiveEquipmentModal {
  constructor() {
    this.modal = null;
    this.cleanup = null;
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    const { modal, closeButtonId } = ModalFactory.createModal({
      id: 'passive-equipment-modal',
      icon: '🧠',
      title: 'Neural Interface Management',
      subtitle: 'Configure Active Passive Abilities',
      contentHTML: `
        <div class="passive-equipment-content">
          <div class="equipment-slots">
            <h4>Active Slots</h4>
            <div id="equipped-passives"></div>
          </div>
          
          <div class="available-passives">
            <h4>Available Passive Abilities</h4>
            <div id="available-passives"></div>
          </div>
        </div>
      `,
      closeButtonId: 'close-passive-equipment',
    });

    this.modal = modal;

    // Setup events using the factory
    this.cleanup = ModalFactory.setupModalEvents(modal, closeButtonId);

    // Add the CSS styles
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');

    style.textContent = `
      .passive-equipment-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
      }
      
      .equipment-slots, .available-passives {
        border: 1px solid #00ff00;
        border-radius: 8px;
        padding: 15px;
        background: rgba(0, 255, 0, 0.05);
      }
      
      .passive-slot {
        border: 2px dashed #666;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-style: italic;
        transition: all 0.2s;
      }
      
      .passive-slot.occupied {
        border: 2px solid #00ff00;
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
        font-style: normal;
      }
      
      .passive-slot.drop-target {
        border-color: #ffaa00;
        background: rgba(255, 170, 0, 0.1);
      }
      
      .passive-ability {
        border: 1px solid #00ff00;
        border-radius: 8px;
        padding: 10px;
        margin: 5px 0;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      }
      
      .passive-ability:hover {
        background: rgba(0, 255, 0, 0.1);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
      }
      
      .passive-ability.equipped {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .passive-ability.dragging {
        opacity: 0.7;
        transform: scale(0.95);
      }
      
      .ability-name {
        font-weight: bold;
        color: #00ff00;
        margin-bottom: 5px;
      }
      
      .ability-description {
        font-size: 0.9em;
        color: #ccffcc;
        line-height: 1.3;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Listen for passive equipment events
    GameEvents.UI.Listeners.openPassiveEquipment(() => {
      this.show();
    });

    // Listen for equipment changes
    GameEvents.Player.Listeners.passiveEquipped(() => {
      this.refresh();
    });

    GameEvents.Player.Listeners.passiveUnequipped(() => {
      this.refresh();
    });
  }

  show() {
    this.refresh();
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
  }

  refresh() {
    this.renderEquippedSlots();
    this.renderAvailablePassives();
  }

  renderEquippedSlots() {
    const stats = getStats();
    const equippedContainer = document.getElementById('equipped-passives');

    equippedContainer.innerHTML = '';

    // Create slots based on player's max passive slots
    const maxSlots = this.getMaxPassiveSlots();

    for (let i = 0; i < maxSlots; i++) {
      const slot = document.createElement('div');

      slot.className = 'passive-slot';
      slot.dataset.slotIndex = i;

      // Check if this slot is occupied
      const equippedPassives = Array.from(stats.equippedPassives || []);
      const equippedAbility = equippedPassives[i];

      if (equippedAbility) {
        const upgrade = UpgradeSystem.getUpgrade(equippedAbility);

        slot.className = 'passive-slot occupied';
        slot.innerHTML = `
          <div>
            <div class="ability-name">${upgrade.icon} ${upgrade.name}</div>
            <div class="ability-description">${upgrade.description}</div>
            <button class="btn btn-small" onclick="this.parentElement.parentElement.dispatchEvent(new CustomEvent('unequip', {detail: '${equippedAbility}'}))">
              Unequip
            </button>
          </div>
        `;
      } else {
        slot.textContent = 'Empty Slot';
      }

      // Add drop handling
      this.setupDropTarget(slot);

      equippedContainer.appendChild(slot);
    }
  }

  renderAvailablePassives() {
    const stats = getStats();
    const availableContainer = document.getElementById('available-passives');

    availableContainer.innerHTML = '';

    // Get all owned passive upgrades
    const allUpgrades = UpgradeSystem.getAllUpgrades();
    const ownedPassives = [];

    for (const [id, upgrade] of Object.entries(allUpgrades)) {
      if (upgrade.type === 'passive' && stats.getUpgradeCount(id) > 0) {
        ownedPassives.push({ id, ...upgrade });
      }
    }

    if (ownedPassives.length === 0) {
      availableContainer.innerHTML =
        '<div style="color: #666; font-style: italic;">No passive abilities available</div>';

      return;
    }

    ownedPassives.forEach(passive => {
      const isEquipped = stats.equippedPassives?.has(passive.id);

      const abilityElement = document.createElement('div');

      abilityElement.className = `passive-ability ${isEquipped ? 'equipped' : ''}`;
      abilityElement.dataset.abilityId = passive.id;
      abilityElement.draggable = !isEquipped;

      abilityElement.innerHTML = `
        <div class="ability-name">${passive.icon} ${passive.name}</div>
        <div class="ability-description">${passive.description}</div>
        ${isEquipped ? '<div style="color: #888; font-size: 0.8em;">Currently Equipped</div>' : ''}
      `;

      if (!isEquipped) {
        this.setupDragHandling(abilityElement);
      }

      availableContainer.appendChild(abilityElement);
    });
  }

  setupDragHandling(element) {
    element.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', element.dataset.abilityId);
      element.classList.add('dragging');
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
    });
  }

  setupDropTarget(slot) {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('drop-target');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drop-target');
    });

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drop-target');

      const abilityId = e.dataTransfer.getData('text/plain');
      const slotIndex = parseInt(slot.dataset.slotIndex);

      this.equipPassive(abilityId, slotIndex);
    });

    // Handle unequip events
    slot.addEventListener('unequip', e => {
      this.unequipPassive(e.detail);
    });
  }

  equipPassive(abilityId, slotIndex) {
    const stats = getStats();

    // Check if already equipped
    if (stats.equippedPassives?.has(abilityId)) {
      GameEvents.Game.Emit.message('Passive ability already equipped');

      return;
    }

    // Check if slot is available
    const maxSlots = this.getMaxPassiveSlots();

    if (slotIndex >= maxSlots) {
      GameEvents.Game.Emit.message('Invalid equipment slot');

      return;
    }

    // Emit equip event
    GameEvents.Player.Emit.equipPassive(abilityId, slotIndex);

    const upgrade = UpgradeSystem.getUpgrade(abilityId);

    GameEvents.Game.Emit.message(`Equipped: ${upgrade.name}`);
  }

  unequipPassive(abilityId) {
    GameEvents.Player.Emit.unequipPassive(abilityId);

    const upgrade = UpgradeSystem.getUpgrade(abilityId);

    GameEvents.Game.Emit.message(`Unequipped: ${upgrade.name}`);
  }

  getMaxPassiveSlots() {
    const stats = getStats();
    const baseSlots = 1;
    const expansionUpgrades =
      stats.getUpgradeCount('PASSIVE_SLOT_EXPANSION') || 0;

    return baseSlots + expansionUpgrades;
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

// Don't initialize immediately - wait for player to be ready
let passiveEquipmentModal = null;

export function initializePassiveEquipmentModal() {
  if (!passiveEquipmentModal) {
    passiveEquipmentModal = new PassiveEquipmentModal();
    console.log('Passive equipment modal initialized');
  }

  return passiveEquipmentModal;
}

export function getPassiveEquipmentModal() {
  return passiveEquipmentModal;
}

export { passiveEquipmentModal };
