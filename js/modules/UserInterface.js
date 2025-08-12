import { eventBus } from './EventBus.js';
import { getStats } from './PlayerStats.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { storySystem } from './StorySystem.js';

class UserInterface {
  constructor() {
    this.statsPanel = document.getElementById('stats-panel');
    this.messagesPanel = document.getElementById('messages-panel');

    // Use new upgrade modal
    this.upgradeModal = document.getElementById('new-upgrade-modal');
    this.upgradeGrid = document.getElementById('upgrade-grid');
    this.closeUpgradeBtn = document.getElementById('close-upgrade-btn');

    // Listen for player updates
    eventBus.on('player-updated', () => {
      this.updateStats();
    });

    // Listen for game messages
    eventBus.on('game-message', message => {
      this.addMessage(message);
    });

    // Listen for modal toggle
    eventBus.on('open-upgrade-menu', () => {
      this.showUpgradeModal();
    });

    // Listen for story discoveries (to update UI)
    eventBus.on('story-discovery', () => {
      this.updateStats(); // Refresh to show new story count
    });

    // Setup modal event listeners
    this.setupUpgradeModalEvents();

    // Initial render
    this.updateStats();
  }

  setupUpgradeModalEvents() {
    // Setup upgrade modal close button
    this.closeUpgradeBtn.addEventListener('click', () => {
      this.hideUpgradeModal();
    });

    // Close modal when clicking outside
    this.upgradeModal.addEventListener('click', e => {
      if (e.target === this.upgradeModal) {
        this.hideUpgradeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', e => {
      if (
        e.key === 'Escape' &&
        this.upgradeModal.classList.contains('active')
      ) {
        this.hideUpgradeModal();
      }
    });
  }

  showUpgradeModal() {
    this.renderUpgradeItems();
    this.upgradeModal.classList.add('active');
  }

  hideUpgradeModal() {
    this.upgradeModal.classList.remove('active');
  }

  renderUpgradeItems() {
    this.upgradeGrid.innerHTML = '';
    const upgrades = UpgradeSystem.getAvailableUpgrades();
    const playerStats = getStats();

    for (const [id, upgrade] of Object.entries(upgrades)) {
      const canAfford = UpgradeSystem.canAffordUpgrade(
        id,
        playerStats.resources
      );
      const currentCount = playerStats.getUpgradeCount(id);

      const upgradeCard = document.createElement('div');

      upgradeCard.className = 'upgrade-card';

      // Show current level if upgrade is repeatable and has been purchased
      const levelDisplay =
        upgrade.repeatable && currentCount > 0
          ? ` (Level ${currentCount})`
          : '';

      upgradeCard.innerHTML = `
        <h3>${upgrade.name}${levelDisplay}</h3>
        <p>${upgrade.description}</p>
        <div class="upgrade-cost">Cost: ${Object.entries(upgrade.cost)
          .map(([type, amount]) => `${amount} ${type}`)
          .join(', ')}</div>
        <button class="upgrade-buy-btn" data-upgrade-id="${id}" ${!canAfford ? 'disabled' : ''}>
          ${canAfford ? 'Purchase' : 'Insufficient Resources'}
        </button>
      `;

      const buyBtn = upgradeCard.querySelector('.upgrade-buy-btn');

      if (canAfford) {
        buyBtn.addEventListener('click', () => {
          UpgradeSystem.purchaseUpgrade(id);
          // Refresh the modal to update costs and availability
          this.renderUpgradeItems();
        });
      }

      this.upgradeGrid.appendChild(upgradeCard);
    }
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

    // Add different styling for story-related messages
    if (message.includes('Story fragment')) {
      messageElement.style.color = '#44ff44';
    }

    this.messagesPanel.appendChild(messageElement);
    this.messagesPanel.scrollTop = this.messagesPanel.scrollHeight;

    // Keep message panel from getting too cluttered
    const messages = this.messagesPanel.children;

    if (messages.length > 20) {
      this.messagesPanel.removeChild(messages[0]);
    }
  }
}

export { UserInterface };
