import { GameEvents } from '../core/game-events.js';
import { getStats } from '../entities/player/player-stats.js';
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';
import { storySystem } from '../systems/story/story-system.js';
import { ModalFactory } from './modal-factory.js';

class UserInterface {
  constructor() {
    this.statsPanel = document.getElementById('stats-panel');
    this.messagesPanel = document.getElementById('messages-panel');

    this.setupEventListeners();
    this.updateStats();
  }

  setupEventListeners() {
    GameEvents.Player.Listeners.updated(() => {
      this.updateStats();
    });

    GameEvents.Game.Listeners.message(message => {
      this.addMessage(message);
    });

    GameEvents.UI.Listeners.openUpgrades(data => {
      this.showUpgradeModal(data?.shopType || 'always_on');
    });

    GameEvents.Story.Listeners.discovery(() => {
      this.updateStats();
    });
  }

  updateStats() {
    const playerStats = getStats();
    const storyCount = storySystem.getDiscoveredCount();
    const groupProgress = storySystem.getAllGroupProgress();

    let storyProgressHTML = '';

    if (groupProgress.length > 0) {
      storyProgressHTML = '<h3>DATA ARCHIVES</h3>';
      groupProgress.forEach(group => {
        if (group.discovered > 0) {
          const status = group.complete ? '✓' : '...';

          storyProgressHTML += `<div style="font-size: 0.8em; color: ${group.complete ? '#44ff44' : '#888'};">
            ${group.icon} ${group.name}: ${group.discovered}/${group.total} ${status}
          </div>`;
        }
      });

      if (storyCount > 0) {
        storyProgressHTML +=
          '<div style="color: #888; font-size: 0.7em; margin-top: 5px;">Press L to open journal</div>';
      }
    }

    this.statsPanel.innerHTML = `
      <h3>SYSTEM STATUS</h3>
      <div>Battery: ${playerStats.battery}/${playerStats.maxBattery}</div>
      <div>Nanites: ${playerStats.resources.Nanites}</div>
      <div>Position: ${playerStats.x}, ${playerStats.y}</div>
      
      ${storyProgressHTML}
    `;
  }

  addMessage(message) {
    const messageElement = document.createElement('div');

    messageElement.textContent = `> ${message}`;
    messageElement.style.marginBottom = '5px';

    if (message.includes('Story fragment')) {
      messageElement.style.color = '#44ff44';
    }

    this.messagesPanel.appendChild(messageElement);
    this.messagesPanel.scrollTop = this.messagesPanel.scrollHeight;

    const messages = this.messagesPanel.children;

    if (messages.length > 20) {
      this.messagesPanel.removeChild(messages[0]);
    }
  }

  // Delegate upgrade modal handling to a separate class
  showUpgradeModal(shopType) {
    if (!this.upgradeModal) {
      this.upgradeModal = new UpgradeModal();
    }

    this.upgradeModal.show(shopType);
  }
}

// Separate upgrade modal into its own class - now using ModalFactory
class UpgradeModal {
  constructor() {
    this.modal = null;
    this.grid = null;
    this.currentShopType = null;
    this.cleanup = null;

    this.createModal();
  }

  createModal() {
    const { modal, closeButtonId } = ModalFactory.createModal({
      id: 'new-upgrade-modal',
      icon: '⚡',
      title: 'Ship Upgrades',
      className: 'upgrade-modal',
      contentHTML: `
        <div class="upgrade-grid-container">
          <div class="upgrade-grid" id="upgrade-grid"></div>
        </div>
      `,
      closeButtonId: 'close-upgrade-btn',
    });

    this.modal = modal;
    this.grid = document.getElementById('upgrade-grid');

    // Setup events using the factory
    this.cleanup = ModalFactory.setupModalEvents(modal, closeButtonId, () => {
      this.hide();
    });
  }

  show(shopType = 'always_on') {
    this.currentShopType = shopType;

    // Update modal title
    const titleElement = this.modal.querySelector('.upgrade-title');

    if (titleElement) {
      titleElement.textContent = UpgradeSystem.getShopTitle(shopType);
    }

    this.renderUpgradeItems();
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
    this.currentShopType = null;
  }

  renderUpgradeItems() {
    this.grid.innerHTML = '';
    const upgrades = UpgradeSystem.getAvailableUpgrades(this.currentShopType);
    const playerStats = getStats();

    for (const [_id, upgrade] of Object.entries(upgrades)) {
      const currentLevel = playerStats.getUpgradeCount(upgrade.id);
      const cost = UpgradeSystem.getUpgradeCost(upgrade.id, currentLevel);
      const canAfford = UpgradeSystem.canAffordUpgrade(
        upgrade.id,
        playerStats.resources
      );

      const upgradeCard = this.createUpgradeCard(
        upgrade,
        currentLevel,
        cost,
        canAfford
      );

      this.grid.appendChild(upgradeCard);
    }

    // Show message if no upgrades available
    if (Object.keys(upgrades).length === 0) {
      this.showNoUpgradesMessage();
    }
  }

  createUpgradeCard(upgrade, currentLevel, cost, canAfford) {
    const upgradeCard = document.createElement('div');

    upgradeCard.className = 'upgrade-card';

    const levelDisplay = this.buildLevelDisplay(upgrade, currentLevel);
    const costDisplay = this.buildCostDisplay(cost);
    const typeIndicator = this.buildTypeIndicator(upgrade.type);
    const specialProps = this.buildSpecialProperties(upgrade);
    const requirementsDisplay = this.buildRequirementsDisplay(
      upgrade,
      canAfford
    );

    upgradeCard.innerHTML = `
      <h3>${upgrade.name}${typeIndicator}</h3>
      ${levelDisplay}
      <p>${upgrade.description}</p>
      ${specialProps}
      ${requirementsDisplay}
      <div class="upgrade-cost">Cost: ${costDisplay}</div>
      <button class="upgrade-buy-btn" data-upgrade-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>
        ${canAfford ? 'Purchase' : 'Insufficient Resources'}
      </button>
    `;

    this.applyCardStyling(upgradeCard);
    this.attachPurchaseHandler(upgradeCard, upgrade, canAfford);

    return upgradeCard;
  }

  buildLevelDisplay(upgrade, currentLevel) {
    if (!upgrade.repeatable) return '';

    const maxLevel = upgrade.maxLevel ? `/${upgrade.maxLevel}` : '';

    return `<div class="upgrade-level">Level ${currentLevel}${maxLevel}</div>`;
  }

  buildCostDisplay(cost) {
    return Object.entries(cost)
      .map(([type, amount]) => `${amount} ${type}`)
      .join(', ');
  }

  buildTypeIndicator(type) {
    const typeIcons = {
      always_on: '',
      passive: '🧠',
      active: '⚡',
    };

    return typeIcons[type] ? ` ${typeIcons[type]}` : '';
  }

  buildSpecialProperties(upgrade) {
    let specialProps = '';

    if (upgrade.cooldown) {
      specialProps += `<div class="upgrade-cooldown">Cooldown: ${upgrade.cooldown.replace('_', ' ')}</div>`;
    }

    if (upgrade.batteryCost) {
      specialProps += `<div class="upgrade-battery-cost">Battery Cost: ${upgrade.batteryCost}</div>`;
    }

    return specialProps;
  }

  buildRequirementsDisplay(upgrade, canAfford) {
    if (!upgrade.requirements || canAfford) return '';

    const playerStats = getStats();
    const reqs = [];

    if (upgrade.requirements.upgradeCount) {
      for (const [reqUpgrade, reqLevel] of Object.entries(
        upgrade.requirements.upgradeCount
      )) {
        const currentReqLevel = playerStats.getUpgradeCount(reqUpgrade);

        if (currentReqLevel < reqLevel) {
          reqs.push(`${reqUpgrade} Level ${reqLevel}`);
        }
      }
    }

    if (upgrade.requirements.storyFragments) {
      const discovered = storySystem.getDiscoveredCount();

      if (discovered < upgrade.requirements.storyFragments) {
        reqs.push(`${upgrade.requirements.storyFragments} story fragments`);
      }
    }

    return reqs.length > 0
      ? `<div class="upgrade-requirements">Requires: ${reqs.join(', ')}</div>`
      : '';
  }

  applyCardStyling(upgradeCard) {
    // Apply inline styles for special elements
    const levelDiv = upgradeCard.querySelector('.upgrade-level');

    if (levelDiv) {
      levelDiv.style.cssText = `
        color: #888;
        font-size: 0.9em;
        margin: 5px 0 10px 0;
        font-style: italic;
      `;
    }

    const cooldownDiv = upgradeCard.querySelector('.upgrade-cooldown');

    if (cooldownDiv) {
      cooldownDiv.style.cssText = `
        color: #ffaa00;
        font-size: 0.8em;
        margin: 5px 0;
        font-style: italic;
      `;
    }

    const batteryCostDiv = upgradeCard.querySelector('.upgrade-battery-cost');

    if (batteryCostDiv) {
      batteryCostDiv.style.cssText = `
        color: #ff6600;
        font-size: 0.8em;
        margin: 5px 0;
        font-weight: bold;
      `;
    }

    const requirements = upgradeCard.querySelector('.upgrade-requirements');

    if (requirements) {
      requirements.style.cssText = `
        color: #ff8800;
        font-size: 0.8em;
        margin: 10px 0;
        font-style: italic;
      `;
    }
  }

  attachPurchaseHandler(upgradeCard, upgrade, canAfford) {
    const buyBtn = upgradeCard.querySelector('.upgrade-buy-btn');

    if (canAfford) {
      buyBtn.addEventListener('click', () => {
        UpgradeSystem.purchaseUpgrade(upgrade.id);
        this.renderUpgradeItems(); // Refresh the display
      });
    }
  }

  showNoUpgradesMessage() {
    const noUpgrades = document.createElement('div');

    noUpgrades.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      color: #888;
      font-style: italic;
      padding: 40px;
    `;
    noUpgrades.textContent = `No ${this.currentShopType.replace('_', ' ')} upgrades available at this time.`;
    this.grid.appendChild(noUpgrades);
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

export { UserInterface };
