class UserInterface {
  constructor(player, eventBus) {
    this.player = player;
    this.levelElement = document.getElementById("battery-level");
    this.textElement = document.getElementById("battery-text");

    // Listen for player updates
    eventBus.on("player-updated", (player) => {
      this.player = player;
      this.update();
    });

    // Initial render
    this.update();
  }

  update() {
    const percent = Math.floor(
      (this.player.battery / this.player.maxBattery) * 100
    );
    this.levelElement.style.width = `${percent}%`;
    this.textElement.textContent = `${this.player.battery}/${this.player.maxBattery}`;

    if (percent < 20) {
      this.levelElement.style.background =
        "linear-gradient(to right, #ff0000, #aa0000)";
      this.textElement.style.color = "#ff0000";
      this.textElement.style.textShadow = "0 0 5px #ff0000";
    } else {
      this.levelElement.style.background =
        "linear-gradient(to right, #00ff00, #00aa00)";
      this.textElement.style.color = "#00ff00";
      this.textElement.style.textShadow = "0 0 5px #00ff00";
    }
  }
}

export { UserInterface };
