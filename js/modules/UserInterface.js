import { eventBus } from "./EventBus.js";

class UserInterface {
  constructor(player) {
    this.player = player;
    this.statsPanel = document.getElementById("stats-panel");
    this.messagesPanel = document.getElementById("messages-panel");

    // Listen for player updates
    eventBus.on("player-updated", (player) => {
      this.player = player;
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
    this.statsPanel.innerHTML = `
      <h3>Resources</h3>
      <div>Battery: ${this.player.battery}/${this.player.maxBattery}</div>
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
