import { Directions } from "./Utils.js";
import { eventBus } from "./EventBus.js";
import {
  RESOURCE_TYPES,
  BASE_RESOURCES,
  modifyResources,
  subtractResources,
} from "./resources.js";
import { getStats } from "./PlayerStats.js";
import { UPGRADE_DEFS, UpgradeSystem } from "./UpgradeSystem.js";

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.battery = 100;
    this.spawnPoint = { x, y };
    this.upgrades = new Map();
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
      this.battery -= this.movementCost;
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

    eventBus.on("purchase-upgrade", (upgrade_def) => {
      if (UpgradeSystem.canAffordUpgrade(upgrade_def.id, this.resources)) {
        this.resources = subtractResources(this.resources, upgrade_def.cost);
        const currentCount = this.getUpgradeCount(upgradeDef.id);
        this.upgrades.set(upgradeDef.id, currentCount + 1);
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

  interact(object) {
    if (typeof object.onInteract === "function") {
      object.onInteract(this);
    }
  }

  get maxBattery() {
    return 100 + (10 * this.upgrades.get(UPGRADE_DEFS.BATTERY_CAPACITY) || 0);
  }

  get harvestMultiplier() {
    return 1 + (0.5 * this.upgrades.get(UPGRADE_DEFS.RESOURCE_HARVEST) || 0);
  }

  get movementCost() {
    return (
      1 *
      Math.pow(0.8, this.upgrades.get(UPGRADE_DEFS.MOVEMENT_EFFICIENCY) || 0)
    );
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.battery = this.maxBattery;
  }
}

export { Player };
