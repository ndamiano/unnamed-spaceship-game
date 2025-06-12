import { Directions } from "./Utils.js";

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1;
    this.battery = 5000;
    this.maxBattery = 5000;
    this.spawnPoint = { x, y };
    this.batteryChange = 1;
    this.direction = Directions.RIGHT;
  }

  render(ctx, centerX, centerY, tileSize) {
    const size = tileSize / 2 - 1;
    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw robot body with rounded corners
    ctx.fillStyle = "#3a7bd5";
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 2, size, size, size / 4);
    ctx.fill();

    // Add body details
    ctx.fillStyle = "#00d2ff";
    ctx.beginPath();
    ctx.roundRect(-size / 3, -size / 3, size * 0.66, size * 0.66, size / 6);
    ctx.fill();

    // Draw robot head with antenna
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, -size * 0.9, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.2);
    ctx.lineTo(0, -size * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -size * 1.2, size / 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction indicators with more style
    ctx.fillStyle = "#ff8a00";
    if (this.direction === Directions.UP) {
      // Arms up
      ctx.beginPath();
      ctx.ellipse(-size * 0.4, -size * 0.6, size / 4, size / 6, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size * 0.4, -size * 0.6, size / 4, size / 6, 0, 0, Math.PI);
      ctx.fill();
    } else if (this.direction === Directions.RIGHT) {
      // Arms right
      ctx.beginPath();
      ctx.ellipse(size * 0.6, -size * 0.2, size / 6, size / 4, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size * 0.6, size * 0.2, size / 6, size / 4, 0, 0, Math.PI);
      ctx.fill();
    } else if (this.direction === Directions.DOWN) {
      // Arms down
      ctx.beginPath();
      ctx.ellipse(-size * 0.4, size * 0.6, size / 4, size / 6, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size * 0.4, size * 0.6, size / 4, size / 6, 0, 0, Math.PI);
      ctx.fill();
    } else {
      // Arms left
      ctx.beginPath();
      ctx.ellipse(-size * 0.6, -size * 0.2, size / 6, size / 4, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-size * 0.6, size * 0.2, size / 6, size / 4, 0, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  registerEventHandlers(eventBus) {
    eventBus.on("player-move", ({ x, y, direction }) => {
      this.x = x;
      this.y = y;
      this.direction = direction;
      this.battery -= this.batteryChange;
      eventBus.emit("player-updated", this);
    });

    eventBus.on("player-direction-change", (direction) => {
      this.direction = direction;
      eventBus.emit("player-updated", this);
    });

    eventBus.on("player-updated", (player) => {
      if (player.battery <= 0) {
        this.reset();
      }
    });

    eventBus.emit("player-updated", this);
  }

  move(x, y) {
    this.battery = Math.max(0, this.battery - 1);
    this.x = x;
    this.y = y;
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
