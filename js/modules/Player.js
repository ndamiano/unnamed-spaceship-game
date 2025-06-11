class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1;
    this.battery = 5000;
    this.maxBattery = 5000;
    this.spawnPoint = { x, y };
    this.batteryChange = 1;
  }

  registerEventHandlers(eventBus) {
    eventBus.on("player-move", ({ dx, dy }) => {
      this.x += dx;
      this.y += dy;
      this.battery -= this.batteryChange;
      eventBus.emit("player-updated", this);
    });

    eventBus.on("player-updated", (player) => {
      if (player.battery <= 0) {
        this.reset();
      }
    });

    eventBus.emit("player-updated", this);
  }

  move(dx, dy) {
    this.battery = Math.max(0, this.battery - 1);
    this.x += dx;
    this.y += dy;
    if (this.onUpdate) this.onUpdate();
  }

  interact(object) {
    if (typeof object.onInteract === "function") {
      object.onInteract(this);
    }
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.battery = this.maxBattery;
    if (this.onUpdate) this.onUpdate();
  }
}

export { Player };
