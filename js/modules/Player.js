import { Directions, randomInt } from "./Utils.js";
import { eventBus } from "./EventBus.js";
import {
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
    this.movementCost = 1;
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
      let movementCost = this.movementCost;
      const hit = randomInt(0, 10);
      if (hit == 1) {
        movementCost = 0;
      }
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
        const currentCount = this.upgrades.get(upgrade_def.id) ?? 0;
        this.upgrades.set(upgrade_def.id, currentCount + 1);
        eventBus.emit("player-updated");
        eventBus.emit("game-message", "Upgrade purchased: " + upgrade_def.name);
      }
    });

    // Resource event handlers
    eventBus.on("add-resource", ({ type, amount }) => {
      const toAdd = amount * this.harvestMultiplier;
      this.resources = modifyResources(this.resources, {
        [type]: toAdd,
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
    const capacityUpgrade =
      this.upgrades.get(UPGRADE_DEFS.BATTERY_CAPACITY.id) || 0;
    return 100 + 100 * capacityUpgrade;
  }

  get harvestMultiplier() {
    const harvestMultiplier =
      this.upgrades.get(UPGRADE_DEFS.RESOURCE_HARVEST.id) || 0;
    return 1 + 0.5 * harvestMultiplier;
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.battery = this.maxBattery;
  }
}

export { Player };
