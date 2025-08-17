import { GameEvents } from '../core/game-events.js';
import { getStats } from '../entities/player/player-stats.js';
import { UpgradeSystem } from '../systems/upgrades/upgrade-system.js';
import { storySystem } from '../systems/story/story-system.js';

class UserInterface {
  constructor() {
    this.statsPanel = document.getElementById('stats-panel');
    this.messagesPanel = document.getElementById('messages-panel');

    this.upgradeModal = document.getElementById('new-upgrade-modal');
    this.upgradeGrid = document.getElementById('upgrade-grid');
    this.closeUpgradeBtn = document.getElementById('close-upgrade-btn');
    this.currentShopType = null;

    this.setupEventListeners();
    this.setupUpgradeModalEvents();

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

  setupUpgradeModalEvents() {
    this.closeUpgradeBtn.addEventListener('click', () => {
      this.hideUpgradeModal();
    });

    this.upgradeModal.addEventListener('click', e => {
      if (e.target === this.upgradeModal) {
        this.hideUpgradeModal();
      }
    });

    document.addEventListener('keydown', e => {
      if (
        e.key === 'Escape' &&
        this.upgradeModal.classList.contains('active')
      ) {
        this.hideUpgradeModal();
      }
    });
  }

  showUpgradeModal(shopType = 'always_on') {
    this.currentShopType = shopType;

    // Update modal title based on shop type
    const titleElement = this.upgradeModal.querySelector('.upgrade-title');

    if (titleElement) {
      titleElement.textContent = UpgradeSystem.getShopTitle(shopType);
    }

    this.renderUpgradeItems();
    this.upgradeModal.classList.add('active');
  }

  hideUpgradeModal() {
    this.upgradeModal.classList.remove('active');
    this.currentShopType = null;
  }

  renderUpgradeItems() {
    this.upgradeGrid.innerHTML = '';
    const upgrades = UpgradeSystem.getAvailableUpgrades(this.currentShopType);
    const playerStats = getStats();

    // Render upgrades directly without categories
    for (const [_id, upgrade] of Object.entries(upgrades)) {
      const currentLevel = playerStats.getUpgradeCount(upgrade.id);
      const cost = UpgradeSystem.getUpgradeCost(upgrade.id, currentLevel);
      const canAfford = UpgradeSystem.canAffordUpgrade(
        upgrade.id,
        playerStats.resources
      );

      const upgradeCard = document.createElement('div');

      upgradeCard.className = 'upgrade-card';

      // Build level display
      let levelDisplay = '';

      if (upgrade.repeatable && currentLevel > 0) {
        const maxLevel = upgrade.maxLevel ? `/${upgrade.maxLevel}` : '';

        levelDisplay = ` (Level ${currentLevel}${maxLevel})`;
      }

      // Build cost display
      const costDisplay = Object.entries(cost)
        .map(([type, amount]) => `${amount} ${type}`)
        .join(', ');

      // Build type indicator - add to end of name
      let typeIndicator = '';
      const typeIcons = {
        always_on: '', // No indicator for always_on since it's the default
        passive: '🧠',
        active: '⚡',
      };

      if (typeIcons[upgrade.type]) {
        typeIndicator = ` ${typeIcons[upgrade.type]}`;
      }

      // Build special properties
      let specialProps = '';

      if (upgrade.cooldown) {
        specialProps += `<div class="upgrade-cooldown">Cooldown: ${upgrade.cooldown.replace('_', ' ')}</div>`;
      }

      if (upgrade.batteryCost) {
        specialProps += `<div class="upgrade-battery-cost">Battery Cost: ${upgrade.batteryCost}</div>`;
      }

      // Build requirements display
      let requirementsDisplay = '';

      if (
        upgrade.requirements &&
        !UpgradeSystem.canAffordUpgrade(upgrade.id, playerStats.resources)
      ) {
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

        if (reqs.length > 0) {
          requirementsDisplay = `<div class="upgrade-requirements">Requires: ${reqs.join(', ')}</div>`;
        }
      }

      upgradeCard.innerHTML = `
        <h3>${upgrade.name}${levelDisplay}${typeIndicator}</h3>
        <p>${upgrade.description}</p>
        ${specialProps}
        ${requirementsDisplay}
        <div class="upgrade-cost">Cost: ${costDisplay}</div>
        <button class="upgrade-buy-btn" data-upgrade-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>
          ${canAfford ? 'Purchase' : 'Insufficient Resources'}
        </button>
      `;

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

      // Add requirements styling
      const requirements = upgradeCard.querySelector('.upgrade-requirements');

      if (requirements) {
        requirements.style.cssText = `
          color: #ff8800;
          font-size: 0.8em;
          margin: 10px 0;
          font-style: italic;
        `;
      }

      const buyBtn = upgradeCard.querySelector('.upgrade-buy-btn');

      if (canAfford) {
        buyBtn.addEventListener('click', () => {
          UpgradeSystem.purchaseUpgrade(upgrade.id);
          this.renderUpgradeItems(); // Refresh the display
        });
      }

      this.upgradeGrid.appendChild(upgradeCard);
    }

    // If no upgrades available
    if (Object.keys(upgrades).length === 0) {
      const noUpgrades = document.createElement('div');

      noUpgrades.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        color: #888;
        font-style: italic;
        padding: 40px;
      `;
      noUpgrades.textContent = `No ${this.currentShopType.replace('_', ' ')} upgrades available at this time.`;
      this.upgradeGrid.appendChild(noUpgrades);
    }
  }

  getCategoryIcon(category) {
    const icons = {
      power: '🔋',
      efficiency: '⚡',
      exploration: '🔍',
      resource: '💎',
      prestige: '👑',
      advanced: '🔬',
      survival: '🛡️',
      expansion: '📈',
      utility: '🔧',
      mobility: '🚀',
      emergency: '🚨',
      general: '⚙️',
    };

    return icons[category] || '⚙️';
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
}

export { UserInterface };
