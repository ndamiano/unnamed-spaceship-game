import { eventBus } from "./EventBus.js";
import { getStats } from "./PlayerStats.js";
import { UpgradeSystem } from "./UpgradeSystem.js";

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
    this.statsPanel.innerHTML = `
      <h3>Resources</h3>
      <div>Battery: ${playerStats.battery}/${playerStats.maxBattery}</div>
      <div>Nanites: ${playerStats.resources.Nanites}</div>
    `;
  }

  addMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.textContent = `> ${message}`;
    messageElement.style.marginBottom = "5px";
    this.messagesPanel.appendChild(messageElement);
    this.messagesPanel.scrollTop = this.messagesPanel.scrollHeight;
  }
}

export { UserInterface };
