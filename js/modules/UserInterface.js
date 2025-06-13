import { eventBus } from "./EventBus.js";
import { getStats } from "./PlayerStats.js";

class UserInterface {
  constructor() {
    this.statsPanel = document.getElementById("stats-panel");
    this.messagesPanel = document.getElementById("messages-panel");

    // Listen for player updates
    eventBus.on("player-updated", () => {
      this.updateStats();
    });

    // Listen for game messages
    eventBus.on("game-message", (message) => {
      this.addMessage(message);
    });

    // Initial render
    this.updateStats();
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
