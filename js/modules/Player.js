import { Directions } from "./Utils.js";
import { eventBus } from "./EventBus.js";
import {
  RESOURCE_TYPES,
  BASE_RESOURCES,
  modifyResources,
} from "./resources.js";
import { getStats } from "./PlayerStats.js";

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1;
    this.battery = 100;
    this.maxBattery = 100;
    this.spawnPoint = { x, y };
    this.batteryChange = 1;
    this.direction = Directions.DOWN;
    this.resources = { ...BASE_RESOURCES };
    this.registerEventHandlers();
  }

  render(ctx, centerX, centerY, tileSize) {
    const assetImage = new Image();
    assetImage.src = `assets/player-100x100.png`;

    ctx.save();

    ctx.translate(centerX, centerY);

    if (this.direction === Directions.UP) {
      ctx.rotate(Math.PI);
    } else if (this.direction === Directions.RIGHT) {
      ctx.rotate(-Math.PI / 2);
    } else if (this.direction === Directions.LEFT) {
      ctx.rotate(Math.PI / 2);
    }

    ctx.drawImage(assetImage, -64, -64);
    ctx.restore();
  }

  registerEventHandlers() {
    eventBus.on("player-move", ({ x, y, direction }) => {
      this.x = x;
      this.y = y;
      this.direction = direction;
      this.battery -= this.batteryChange;
      eventBus.emit("player-updated", getStats());
    });

    eventBus.on("player-direction-change", (direction) => {
      this.direction = direction;
      eventBus.emit("player-updated", this);
    });

    eventBus.on("player-updated", (player) => {
      if (player.battery <= 0) {
        eventBus.emit(
          "game-message",
          "As you feel your battery getting close to empty, you return to your charging pod."
        );
        eventBus.emit("reset-state");
        this.reset();
      }
    });

    // Resource event handlers
    eventBus.on(`add${RESOURCE_TYPES.NANITES}`, (amount) => {
      this.resources = modifyResources(this.resources, {
        [RESOURCE_TYPES.NANITES]: amount,
      });
      eventBus.emit("player-updated", getStats());
    });
    eventBus.on(`add${RESOURCE_TYPES.SHIP_PARTS}`, (amount) => {
      this.resources = modifyResources(this.resources, {
        [RESOURCE_TYPES.SHIP_PARTS]: amount,
      });
      eventBus.emit("player-updated", getStats());
    });
    eventBus.on(`add${RESOURCE_TYPES.RESEARCH_POINTS}`, (amount) => {
      this.resources = modifyResources(this.resources, {
        [RESOURCE_TYPES.RESEARCH_POINTS]: amount,
      });
      eventBus.emit("player-updated", getStats());
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
