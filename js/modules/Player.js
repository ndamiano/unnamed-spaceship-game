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
    this.direction = Directions.DOWN;
  }

  render(ctx, centerX, centerY, tileSize) {
    const assetImage = new Image();
    assetImage.src = `assets/player-100x100.png`;

    ctx.save();

    ctx.translate(centerX, centerY); // Move origin to center of screen

    if (this.direction === Directions.UP) {
      ctx.rotate(Math.PI); // 180°
    } else if (this.direction === Directions.RIGHT) {
      ctx.rotate(-Math.PI / 2); // -90°
    } else if (this.direction === Directions.LEFT) {
      ctx.rotate(Math.PI / 2); // +90°
    }

    // Draw image centered at new origin
    ctx.drawImage(assetImage, -64, -64); // draw centered

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
