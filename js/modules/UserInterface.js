import { eventBus } from "./EventBus.js";
import { getStats } from "./PlayerStats.js";
import { UpgradeSystem } from "./UpgradeSystem.js";
import { storySystem } from "./StorySystem.js";

class UserInterface {
  constructor() {
    this.statsPanel = document.getElementById("stats-panel");
    this.messagesPanel = document.getElementById("messages-panel");
    this.upgradeModal = document.getElementById("upgrade-modal");
    this.upgradesGrid = document.querySelector(".upgrades-grid");
    this.closeModalBtn = document.getElementById("close-modal");

    // Listen for player updates
    eventBus.on("player-updated", () => {
      this.updateStats();
    });

    // Listen for game messages
    eventBus.on("game-message", (message) => {
      this.addMessage(message);
    });

    // Listen for modal toggle
    eventBus.on("open-upgrade-menu", () => {
      this.showUpgradeModal();
    });

    // Listen for story discoveries (to update UI)
    eventBus.on("story-discovery", () => {
      this.updateStats(); // Refresh to show new story count
    });

    // Setup modal close button
    this.closeModalBtn.addEventListener("click", () => {
      this.hideUpgradeModal();
    });

    // Initial render
    this.updateStats();
  }

  showUpgradeModal() {
    this.renderUpgradeItems();
    this.upgradeModal.style.display = "flex";
  }

  hideUpgradeModal() {
    this.upgradeModal.style.display = "none";
  }

  renderUpgradeItems() {
    this.upgradesGrid.innerHTML = "";
    const upgrades = UpgradeSystem.getAvailableUpgrades();

    for (const [id, upgrade] of Object.entries(upgrades)) {
      const upgradeEl = document.createElement("div");
      upgradeEl.className = "upgrade-item";
      upgradeEl.innerHTML = `
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div class="upgrade-cost">Cost: ${Object.entries(upgrade.cost)
          .map(([type, amount]) => `${amount} ${type}`)
          .join(", ")}</div>
        <button class="buy-btn" data-upgrade-id="${id}">Purchase</button>
      `;

      upgradeEl.querySelector(".buy-btn").addEventListener("click", () => {
        UpgradeSystem.purchaseUpgrade(id);
      });

      this.upgradesGrid.appendChild(upgradeEl);
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
          const percentage = Math.floor((group.discovered / group.total) * 100);
          const status = group.complete ? '✓' : '...';
          storyProgressHTML += `<div style="font-size: 0.8em; color: ${group.complete ? '#44ff44' : '#888'};">
            ${group.icon} ${group.name}: ${group.discovered}/${group.total} ${status}
          </div>`;
        }
      });
      
      if (storyCount > 0) {
        storyProgressHTML += '<div style="color: #888; font-size: 0.7em; margin-top: 5px;">Press L to review logs</div>';
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
    const messageElement = document.createElement("div");
    messageElement.textContent = `> ${message}`;
    messageElement.style.marginBottom = "5px";
    
    // Add different styling for story-related messages
    if (message.includes("Story fragment")) {
      messageElement.style.color = "#44ff44";
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